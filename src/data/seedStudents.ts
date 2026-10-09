/**
 * Deterministic Seed Dataset for CampusPulse AI
 * Generates 125 realistic student profiles across CSE, ECE, EEE, IT, and MECH.
 * Includes intentional variations for academic risk, placement readiness, segmentation,
 * and missing data for score renormalization.
 */

import { Student, Department } from '../types';
import { computeSuccessScore, DEFAULT_WEIGHTS } from '../services/scoringEngine';
import { evaluateRisks, DEFAULT_RISK_THRESHOLDS } from '../services/riskEngine';
import { evaluateStudentSegments } from '../services/segmentationService';

const FIRST_NAMES = [
  'Aarav', 'Aditi', 'Akash', 'Ananya', 'Arjun', 'Bhavya', 'Chetan', 'Deepika', 'Divya', 'Gautam',
  'Harish', 'Ishaan', 'Jaya', 'Karthik', 'Kavya', 'Madhav', 'Meera', 'Naveen', 'Neha', 'Nikhil',
  'Pooja', 'Pranav', 'Priya', 'Rahul', 'Rhea', 'Rohan', 'Sakshi', 'Sameer', 'Sanjay', 'Shreya',
  'Siddharth', 'Sneha', 'Tanvi', 'Tarun', 'Varun', 'Vandana', 'Vikram', 'Vinay', 'Yash', 'Zara',
  'Abhinav', 'Archana', 'Bhavesh', 'Charu', 'Devansh', 'Esha', 'Farhan', 'Gayatri', 'Himanshu', 'Ipsita'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Iyer', 'Patel', 'Reddy', 'Nair', 'Kulkarni', 'Chopra', 'Gupta', 'Singh',
  'Deshmukh', 'Menon', 'Rao', 'Bose', 'Chatterjee', 'Mishra', 'Pandey', 'Pillai', 'Saxena', 'Bhat',
  'Joshi', 'Mehta', 'Nambiar', 'Ghosh', 'Malhotra', 'Aggarwal', 'Choudhury', 'Sundaram', 'Thakur', 'Tripathi'
];

const MENTORS: Record<Department, string[]> = {
  CSE: ['Dr. Anita Sundaram', 'Prof. Ramesh Kulkarni', 'Dr. Swati Sen'],
  ECE: ['Prof. Venkatesh Iyer', 'Dr. Radhika Nair', 'Prof. Arvind Menon'],
  EEE: ['Dr. Hariprasad Rao', 'Prof. Meenakshi Joshi', 'Dr. S. K. Gupta'],
  IT: ['Prof. Deepali Roy', 'Dr. Alok Nath', 'Prof. Sunita Patil'],
  MECH: ['Dr. Rajendra Verma', 'Prof. Sunil Deshmukh', 'Dr. M. S. Pillai'],
};

const COURSES_BY_DEPT: Record<Department, string[][]> = {
  CSE: [
    ['CS301', 'Data Structures & Algorithms'],
    ['CS302', 'Operating Systems'],
    ['CS303', 'Database Management Systems'],
    ['CS304', 'Computer Networks'],
  ],
  ECE: [
    ['EC301', 'Signals and Systems'],
    ['EC302', 'Digital Signal Processing'],
    ['EC303', 'Microcontrollers & Embedded'],
    ['EC304', 'VLSI Design'],
  ],
  EEE: [
    ['EE301', 'Electrical Machines II'],
    ['EE302', 'Power System Analysis'],
    ['EE303', 'Control Systems Engineering'],
    ['EE304', 'Power Electronics'],
  ],
  IT: [
    ['IT301', 'Web Application Development'],
    ['IT302', 'Cloud Computing & DevOps'],
    ['IT303', 'Information Security'],
    ['IT304', 'Mobile Application Development'],
  ],
  MECH: [
    ['ME301', 'Applied Thermodynamics'],
    ['ME302', 'Fluid Mechanics & Machinery'],
    ['ME303', 'Kinematics of Machinery'],
    ['ME304', 'Manufacturing Technology II'],
  ],
};

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export function generateSeedStudents(): Student[] {
  const departments: Department[] = ['CSE', 'ECE', 'EEE', 'IT', 'MECH'];
  const students: Student[] = [];
  let seed = 42;

  // Distribution: CSE (30), ECE (25), EEE (22), IT (25), MECH (23) -> Total = 125
  const deptQuotas: Record<Department, number> = {
    CSE: 30,
    ECE: 25,
    EEE: 22,
    IT: 25,
    MECH: 23,
  };

  let globalCounter = 1;

  for (const dept of departments) {
    const count = deptQuotas[dept];
    const mentors = MENTORS[dept];
    const courses = COURSES_BY_DEPT[dept];

    for (let i = 0; i < count; i++) {
      const idNum = String(globalCounter).padStart(3, '0');
      const id = `CP-2023-${dept}-${idNum}`;
      globalCounter++;

      const fn = FIRST_NAMES[(globalCounter * 7 + i * 3) % FIRST_NAMES.length];
      const ln = LAST_NAMES[(globalCounter * 5 + i * 11) % LAST_NAMES.length];
      const name = `${fn} ${ln}`;
      const email = `${fn.toLowerCase()}.${ln.toLowerCase()}@campuspulse.edu`;
      const phone = `+91 98${String(10000000 + ((globalCounter * 12345) % 89999999))}`;

      // Distribute Years (1: 20%, 2: 25%, 3: 35%, 4: 20%)
      const yearRandom = pseudoRandom(seed++);
      let year = 3;
      if (yearRandom < 0.20) year = 1;
      else if (yearRandom < 0.45) year = 2;
      else if (yearRandom < 0.80) year = 3;
      else year = 4;

      const semester = year * 2 - (pseudoRandom(seed++) > 0.5 ? 0 : 1);
      const section = ['A', 'B', 'C'][i % 3];
      const mentorName = mentors[i % mentors.length];

      // Intentional Archetype Assignment for rich realistic variance:
      // Archetypes:
      // 0: High Performer / Balanced (CGPA 8.5-9.8, Att 85-98%, Placement 80-95)
      // 1: High Academic, Low Placement (CGPA 8.0-9.2, Att 80-92%, Coding 25-45)
      // 2: Strong Placement, Weak Academics (CGPA 5.5-6.4, Att 72-82%, Coding 75-92, Aptitude 70-85)
      // 3: High Academic Risk - Low Attendance (Att 52-64%, CGPA 5.2-6.5, Backlogs 1-3)
      // 4: High Academic Risk - Severe Backlogs (Backlogs 3-5, CGPA 4.1-4.9, Att 60-70%)
      // 5: Low LMS Disengaged (LMS logins 1-2, Assignment 35-48%, CGPA 6.2-7.1)
      // 6: Steady Average (CGPA 6.8-7.7, Att 75-84%, Placement 55-68)
      // 7: Missing Data Student (renormalization test case)
      const archetypeIndex = i % 8;

      let cgpa: number | null = 6.8;
      let prevCgpa: number | null = 6.9;
      let backlogs = 0;
      let attendance: number | null = 78;
      let lmsLoginsPerWeek: number | null = 5;
      let assignmentCompletionRate: number | null = 75;
      let videoWatchPercentage: number | null = 70;
      let clubCount: number | null = 1;
      let eventCount: number | null = 2;
      let hasLeadership = false;
      let sportsOrCultural = false;
      let codingScore: number | null = 60;
      let aptitudeScore: number | null = 62;
      let interviewScore: number | null = 65;
      let resumeScore: number | null = 70;
      let techSkill: number | null = 6.5;
      let softSkill: number | null = 7.0;
      let internshipStatus: 'Completed' | 'In Progress' | 'Not Started' = 'In Progress';
      let targetTier: 'Tier 1 / Product' | 'Core Engineering' | 'IT Services' | 'Consulting' = 'IT Services';

      if (archetypeIndex === 0) {
        // Balanced High Performer
        cgpa = Math.round((8.5 + pseudoRandom(seed++) * 1.3) * 100) / 100;
        prevCgpa = Math.round((cgpa - 0.1 + pseudoRandom(seed++) * 0.2) * 100) / 100;
        backlogs = 0;
        attendance = Math.round(85 + pseudoRandom(seed++) * 13);
        lmsLoginsPerWeek = Math.round(9 + pseudoRandom(seed++) * 5);
        assignmentCompletionRate = Math.round(90 + pseudoRandom(seed++) * 10);
        videoWatchPercentage = Math.round(85 + pseudoRandom(seed++) * 15);
        clubCount = Math.round(2 + pseudoRandom(seed++) * 2);
        eventCount = Math.round(3 + pseudoRandom(seed++) * 3);
        hasLeadership = true;
        sportsOrCultural = true;
        codingScore = Math.round(78 + pseudoRandom(seed++) * 18);
        aptitudeScore = Math.round(80 + pseudoRandom(seed++) * 18);
        interviewScore = Math.round(82 + pseudoRandom(seed++) * 15);
        resumeScore = Math.round(85 + pseudoRandom(seed++) * 12);
        techSkill = 8.5;
        softSkill = 9.0;
        internshipStatus = 'Completed';
        targetTier = dept === 'MECH' || dept === 'EEE' ? 'Core Engineering' : 'Tier 1 / Product';
      } else if (archetypeIndex === 1) {
        // High Academic, Low Placement
        cgpa = Math.round((8.0 + pseudoRandom(seed++) * 1.4) * 100) / 100;
        prevCgpa = Math.round(cgpa * 100) / 100;
        backlogs = 0;
        attendance = Math.round(82 + pseudoRandom(seed++) * 12);
        lmsLoginsPerWeek = 8;
        assignmentCompletionRate = 92;
        videoWatchPercentage = 88;
        clubCount = 1;
        eventCount = 1;
        hasLeadership = false;
        sportsOrCultural = false;
        codingScore = Math.round(25 + pseudoRandom(seed++) * 18); // Low coding!
        aptitudeScore = Math.round(42 + pseudoRandom(seed++) * 14);
        interviewScore = Math.round(38 + pseudoRandom(seed++) * 15);
        resumeScore = Math.round(45 + pseudoRandom(seed++) * 15);
        techSkill = 5.0;
        softSkill = 5.5;
        internshipStatus = 'Not Started';
        targetTier = 'IT Services';
      } else if (archetypeIndex === 2) {
        // Strong Placement, Weak Academics
        cgpa = Math.round((5.6 + pseudoRandom(seed++) * 0.8) * 100) / 100;
        prevCgpa = Math.round((cgpa + 0.3) * 100) / 100;
        backlogs = 1;
        attendance = Math.round(72 + pseudoRandom(seed++) * 8);
        lmsLoginsPerWeek = 4;
        assignmentCompletionRate = 60;
        videoWatchPercentage = 55;
        clubCount = 3;
        eventCount = 4;
        hasLeadership = true;
        sportsOrCultural = true;
        codingScore = Math.round(82 + pseudoRandom(seed++) * 15); // High coding!
        aptitudeScore = Math.round(76 + pseudoRandom(seed++) * 15);
        interviewScore = Math.round(80 + pseudoRandom(seed++) * 14);
        resumeScore = Math.round(82 + pseudoRandom(seed++) * 12);
        techSkill = 8.5;
        softSkill = 8.0;
        internshipStatus = 'Completed';
        targetTier = 'Tier 1 / Product';
      } else if (archetypeIndex === 3) {
        // High Academic Risk - Low Attendance
        attendance = Math.round(52 + pseudoRandom(seed++) * 12); // < 65%!!
        cgpa = Math.round((5.2 + pseudoRandom(seed++) * 1.1) * 100) / 100;
        prevCgpa = Math.round((cgpa + 0.6) * 100) / 100;
        backlogs = 2;
        lmsLoginsPerWeek = 2;
        assignmentCompletionRate = 45;
        videoWatchPercentage = 40;
        clubCount = 0;
        eventCount = 0;
        hasLeadership = false;
        sportsOrCultural = false;
        codingScore = Math.round(35 + pseudoRandom(seed++) * 18);
        aptitudeScore = Math.round(40 + pseudoRandom(seed++) * 15);
        interviewScore = Math.round(42 + pseudoRandom(seed++) * 15);
        resumeScore = Math.round(48 + pseudoRandom(seed++) * 12);
        techSkill = 4.0;
        softSkill = 4.5;
        internshipStatus = 'Not Started';
        targetTier = 'IT Services';
      } else if (archetypeIndex === 4) {
        // High Academic Risk - Severe Backlogs & CGPA < 5.0
        cgpa = Math.round((4.2 + pseudoRandom(seed++) * 0.7) * 100) / 100; // < 5.0!!
        prevCgpa = Math.round((cgpa + 0.5) * 100) / 100;
        backlogs = Math.round(3 + pseudoRandom(seed++) * 3); // 3-6 backlogs!!
        attendance = Math.round(58 + pseudoRandom(seed++) * 14);
        lmsLoginsPerWeek = 2;
        assignmentCompletionRate = 38;
        videoWatchPercentage = 30;
        clubCount = 0;
        eventCount = 0;
        hasLeadership = false;
        sportsOrCultural = false;
        codingScore = Math.round(30 + pseudoRandom(seed++) * 15);
        aptitudeScore = Math.round(32 + pseudoRandom(seed++) * 15);
        interviewScore = Math.round(35 + pseudoRandom(seed++) * 15);
        resumeScore = Math.round(38 + pseudoRandom(seed++) * 12);
        techSkill = 3.5;
        softSkill = 4.0;
        internshipStatus = 'Not Started';
        targetTier = 'IT Services';
      } else if (archetypeIndex === 5) {
        // Low LMS Disengagement
        cgpa = Math.round((6.8 + pseudoRandom(seed++) * 0.7) * 100) / 100;
        prevCgpa = cgpa;
        backlogs = 0;
        attendance = Math.round(76 + pseudoRandom(seed++) * 6);
        lmsLoginsPerWeek = 1; // extremely low LMS
        assignmentCompletionRate = 42;
        videoWatchPercentage = 35;
        clubCount = 1;
        eventCount = 1;
        hasLeadership = false;
        sportsOrCultural = false;
        codingScore = Math.round(55 + pseudoRandom(seed++) * 15);
        aptitudeScore = Math.round(58 + pseudoRandom(seed++) * 15);
        interviewScore = Math.round(60 + pseudoRandom(seed++) * 12);
        resumeScore = Math.round(62 + pseudoRandom(seed++) * 12);
        techSkill = 6.0;
        softSkill = 6.0;
        internshipStatus = 'Not Started';
        targetTier = 'IT Services';
      } else if (archetypeIndex === 7) {
        // Testing Insufficient / Missing Data renormalization
        if (i % 2 === 0) {
          // Missing Placement assessment
          codingScore = null;
          aptitudeScore = null;
          interviewScore = null;
          resumeScore = null;
          cgpa = Math.round((7.2 + pseudoRandom(seed++) * 0.8) * 100) / 100;
          attendance = Math.round(80 + pseudoRandom(seed++) * 8);
        } else {
          // Missing LMS data
          lmsLoginsPerWeek = null;
          assignmentCompletionRate = null;
          videoWatchPercentage = null;
          cgpa = Math.round((6.9 + pseudoRandom(seed++) * 0.7) * 100) / 100;
          attendance = Math.round(77 + pseudoRandom(seed++) * 6);
        }
      }

      // Generate semester marks
      const semesterMarks = [];
      const currentCgpa = cgpa ?? 6.5;
      for (let s = 1; s <= semester; s++) {
        const delta = (pseudoRandom(seed++) - 0.45) * 0.6;
        const sgpa = Math.min(10.0, Math.max(3.5, Math.round((currentCgpa + delta) * 100) / 100));
        semesterMarks.push({
          semester: s,
          sgpa,
          credits: 22,
        });
      }

      // Course-level attendance
      const currentAtt = attendance ?? 75;
      const courseAttendance = courses.map(([code, cName]) => {
        const dev = Math.round((pseudoRandom(seed++) - 0.5) * 12);
        const cPct = Math.min(100, Math.max(35, currentAtt + dev));
        const total = 45;
        const attended = Math.round((cPct / 100) * total);
        return {
          courseCode: code,
          courseName: cName,
          total,
          attended,
          percentage: Math.round((attended / total) * 100),
        };
      });

      // Skills items
      const skillsList = [
        { name: dept === 'CSE' || dept === 'IT' ? 'Data Structures & Algorithms' : 'Domain Fundamentals', level: (cgpa ?? 7) > 7.5 ? 'Advanced' as const : 'Intermediate' as const, category: 'Technical' as const },
        { name: dept === 'CSE' || dept === 'IT' ? 'Python / Java Fullstack' : 'CAD / Simulation Tools', level: (codingScore ?? 50) > 70 ? 'Advanced' as const : 'Intermediate' as const, category: 'Technical' as const },
        { name: 'Quantitative Aptitude', level: (aptitudeScore ?? 50) > 70 ? 'Advanced' as const : 'Intermediate' as const, category: 'Core' as const },
        { name: 'Technical Problem Solving', level: 'Intermediate' as const, category: 'Technical' as const },
        { name: 'Verbal & Professional Communication', level: (softSkill ?? 5) > 7 ? 'Advanced' as const : 'Intermediate' as const, category: 'Soft' as const },
      ];

      // Realistic feedback notes
      const mentorFeedback = [
        {
          id: `fb-${id}-1`,
          date: '2026-08-20',
          mentor: mentorName,
          note: `Mid-term progress discussion completed. Focus areas outlined for upcoming examinations.`,
          category: 'Academic' as const,
        },
      ];
      if (backlogs > 0) {
        mentorFeedback.push({
          id: `fb-${id}-2`,
          date: '2026-09-12',
          mentor: mentorName,
          note: `Remedial tutoring suggested for previous backlog subjects. Student agreed to attend after-hours tutorial sessions.`,
          category: 'Academic' as const,
        });
      }

      // Compute success score & risks
      const studentDraft: Partial<Student> = {
        id,
        name,
        email,
        phone,
        department: dept,
        year,
        semester,
        section,
        mentorName,
        cgpa,
        prevCgpa,
        backlogs,
        semesterMarks,
        attendance,
        courseAttendance,
        lmsLoginsPerWeek,
        assignmentCompletionRate,
        videoWatchPercentage,
        lastLmsActiveDate: '2026-10-06',
        clubParticipationCount: clubCount,
        eventParticipationCount: eventCount,
        hasLeadershipRole: hasLeadership,
        sportsOrCultural,
        aptitudeScore,
        codingScore,
        mockInterviewScore: interviewScore,
        resumeScore,
        internshipStatus,
        placedStatus: year === 4 && (codingScore ?? 0) > 75 ? 'Placed' : year === 4 ? 'In Process' : 'Not Placed',
        targetCompanyTier: targetTier,
        technicalSkill: techSkill,
        softSkill,
        skillsList,
        mentorFeedback,
      };

      const scoreResult = computeSuccessScore(studentDraft, DEFAULT_WEIGHTS);
      const riskResult = evaluateRisks(studentDraft, DEFAULT_RISK_THRESHOLDS);

      const fullStudent: Student = {
        ...(studentDraft as any),
        successScore: scoreResult.successScore,
        successScoreBreakdown: scoreResult.breakdown,
        dataCompleteness: scoreResult.dataCompleteness,
        isProvisionalScore: scoreResult.isProvisional,
        academicRisk: riskResult.academicRisk,
        academicRiskReasons: riskResult.academicRiskReasons,
        placementReadinessScore: riskResult.placementReadinessScore,
        placementRisk: riskResult.placementRisk,
        placementRiskReasons: riskResult.placementRiskReasons,
        applicableSegments: [],
      };

      fullStudent.applicableSegments = evaluateStudentSegments(fullStudent);
      students.push(fullStudent);
    }
  }

  return students;
}
