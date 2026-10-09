/**
 * Migration & Cloud Synchronization Service
 * Handles safe, verified migration of local browser student records to Supabase PostgreSQL.
 * Guarantees that local storage is NEVER erased, handles duplicate detection,
 * provides pre-migration previews, progress tracking, and verification audits.
 */

import { Student } from '../types';
import { SupabaseService } from './supabaseService';
import { getSupabaseClient } from '../lib/supabase';

export interface MigrationPreview {
  localCount: number;
  cloudCount: number;
  newToCloudCount: number;
  existingInCloudCount: number;
  canMigrate: boolean;
  cloudConnected: boolean;
  errorMessage?: string;
  duplicateIds: string[];
}

export interface MigrationResult {
  success: boolean;
  totalAttempted: number;
  successfullyMigrated: number;
  skippedDuplicates: number;
  failedCount: number;
  verifiedCloudCount: number;
  errors: string[];
  timestamp: string;
}

export const MigrationService = {
  /**
   * Previews records before migration begins without writing any database records.
   */
  async prepareMigrationPreview(localStudents: Student[]): Promise<MigrationPreview> {
    const conn = await SupabaseService.checkConnection();
    if (!conn.connected || !conn.tableExists) {
      return {
        localCount: localStudents.length,
        cloudCount: 0,
        newToCloudCount: 0,
        existingInCloudCount: 0,
        canMigrate: false,
        cloudConnected: conn.connected,
        errorMessage: conn.error || 'Cannot connect to Supabase database table.',
        duplicateIds: [],
      };
    }

    const client = getSupabaseClient();
    if (!client) {
      return {
        localCount: localStudents.length,
        cloudCount: 0,
        newToCloudCount: 0,
        existingInCloudCount: 0,
        canMigrate: false,
        cloudConnected: false,
        errorMessage: 'Supabase client is not available.',
        duplicateIds: [],
      };
    }

    try {
      // Fetch existing cloud IDs to check for duplicates
      const { data: existingCloudRows, error } = await client
        .from('campuspulse_students')
        .select('id');

      if (error) {
        return {
          localCount: localStudents.length,
          cloudCount: conn.count,
          newToCloudCount: 0,
          existingInCloudCount: 0,
          canMigrate: false,
          cloudConnected: true,
          errorMessage: error.message,
          duplicateIds: [],
        };
      }

      const cloudIdSet = new Set((existingCloudRows || []).map((r) => r.id));
      const duplicates: string[] = [];
      let newCount = 0;

      localStudents.forEach((student) => {
        if (cloudIdSet.has(student.id)) {
          duplicates.push(student.id);
        } else {
          newCount++;
        }
      });

      return {
        localCount: localStudents.length,
        cloudCount: cloudIdSet.size,
        newToCloudCount: newCount,
        existingInCloudCount: duplicates.length,
        canMigrate: true,
        cloudConnected: true,
        duplicateIds: duplicates,
      };
    } catch (err: any) {
      return {
        localCount: localStudents.length,
        cloudCount: 0,
        newToCloudCount: 0,
        existingInCloudCount: 0,
        canMigrate: false,
        cloudConnected: false,
        errorMessage: err?.message || 'Error inspecting existing cloud records.',
        duplicateIds: [],
      };
    }
  },

  /**
   * Safely migrates local students to Supabase.
   * NEVER erases local records.
   */
  async executeMigration(
    localStudents: Student[],
    conflictStrategy: 'upsert_all' | 'skip_duplicates' = 'upsert_all',
    onProgress?: (progress: { current: number; total: number; message: string }) => void
  ): Promise<MigrationResult> {
    const timestamp = new Date().toISOString();
    const preview = await this.prepareMigrationPreview(localStudents);

    if (!preview.canMigrate) {
      return {
        success: false,
        totalAttempted: 0,
        successfullyMigrated: 0,
        skippedDuplicates: 0,
        failedCount: 0,
        verifiedCloudCount: preview.cloudCount,
        errors: [preview.errorMessage || 'Cannot proceed with migration.'],
        timestamp,
      };
    }

    let recordsToUpload = localStudents;
    let skippedCount = 0;

    if (conflictStrategy === 'skip_duplicates') {
      const dupSet = new Set(preview.duplicateIds);
      recordsToUpload = localStudents.filter((s) => !dupSet.has(s.id));
      skippedCount = preview.duplicateIds.length;
    }

    if (onProgress) {
      onProgress({
        current: 0,
        total: recordsToUpload.length,
        message: `Beginning upload of ${recordsToUpload.length} records in batches...`,
      });
    }

    const uploadRes = await SupabaseService.batchUpsertStudents(
      recordsToUpload,
      (processed, total) => {
        if (onProgress) {
          onProgress({
            current: processed,
            total,
            message: `Uploaded ${processed} of ${total} student records to Supabase...`,
          });
        }
      }
    );

    // Verify final cloud count directly from Supabase
    const verifiedCount = await SupabaseService.getStudentCount();

    if (onProgress) {
      onProgress({
        current: recordsToUpload.length,
        total: recordsToUpload.length,
        message: `Migration completed. Verified ${verifiedCount} total records in Supabase.`,
      });
    }

    return {
      success: uploadRes.failedCount === 0,
      totalAttempted: recordsToUpload.length,
      successfullyMigrated: uploadRes.successCount,
      skippedDuplicates: skippedCount,
      failedCount: uploadRes.failedCount,
      verifiedCloudCount: verifiedCount,
      errors: uploadRes.errors,
      timestamp,
    };
  },
};
