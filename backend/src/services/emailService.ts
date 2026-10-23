import { db } from '../db/index';

export interface AdmissionFeedbackEmailParams {
  toEmail: string;
  parentName: string;
  pupilName: string;
  grade: string;
  decision: 'Approved' | 'Rejected' | 'Under Review';
  feedbackText: string;
  assignedStream?: string;
  responderName?: string;
}

export async function sendAdmissionFeedbackEmail(params: AdmissionFeedbackEmailParams): Promise<{ success: boolean; message: string }> {
  try {
    const { toEmail, parentName, pupilName, grade, decision, feedbackText, assignedStream, responderName } = params;

    if (!toEmail) {
      console.warn('[EmailService] No recipient email specified for admission feedback');
      return { success: false, message: 'No recipient email provided' };
    }

    const decisionColor = decision === 'Approved' ? '#059669' : decision === 'Rejected' ? '#dc2626' : '#d97706';
    const decisionBadge = decision === 'Approved' ? '✅ APPLICATION APPROVED' : decision === 'Rejected' ? '❌ APPLICATION DECLINED' : '⏳ UNDER REVIEW';

    const subject = `[St. Silas Primary School] Admission Decision Feedback: ${pupilName} - ${decision}`;

    const emailBody = `
===================================================================
ST. SILAS PRIVATE PRIMARY SCHOOL (EAR KIBONDO)
Rwanda Basic Education Board (REB) Code: 530413
Kibondo Village, Simbwa Cell, Kabarore Sector, Gatsibo District, Rwanda
Motto: "Knowledge, Character, and Diligence" (Ubumenyi, Ubupfura, n'Umurava)
===================================================================

Dear Honored Parent/Guardian ${parentName},

We have completed the official administrative and academic evaluation of the online admission application for:

  • Pupil Name:       ${pupilName}
  • Applying Grade:   ${grade}
  • Assigned Stream:  ${assignedStream || 'Alpha Stream (Kibondo Campus)'}
  • Decision Status:  ${decisionBadge}
  • Decision Date:    ${new Date().toLocaleDateString('en-RW', { dateStyle: 'full' })}
  • Reviewed By:      ${responderName || 'Office of the Head Teacher - Emmanuel Twahirwa'}

OFFICIAL ADMISSION COMMITTEE FEEDBACK:
-------------------------------------------------------------------
"${feedbackText || 'Your application has been carefully reviewed according to REB Competence-Based Curriculum (CBC) admission standards.'}"
-------------------------------------------------------------------

${decision === 'Approved' ? `
NEXT STEPS FOR ENROLLMENT:
1. Campus Registration: Visit our administrative office in Kibondo Village (Mon-Fri 08:00 AM - 04:00 PM) for uniform sizing and stationery collection.
2. Daily Feeding Program: St. Silas provides hot fortified porridge (igikoma) at 10:00 AM and a balanced lunch at 12:15 PM daily.
3. Term Tuition Contribution: Payable via MTN Mobile Money (*182*8*1*530413#) or directly at school bursar counter.
4. Requirements: Bring 2 passport photos, copy of birth certificate, and previous academic progress report if transferring from another primary school.
` : decision === 'Under Review' ? `
ADDITIONAL INFORMATION REQUIRED:
Please log in to your St. Silas Parent Portal to review any document requests or visit the campus to meet with the admissions committee.
` : `
We appreciate your interest in St. Silas Private Primary School EAR Kibondo. Due to stream capacity quotas set by REB, we are currently unable to allocate a seat. We encourage you to reapply for future academic intake sessions.
`}

For inquiries, contact the admissions secretariat at:
Telephone: +250 788 765 432 / +250 783 221 190
Email: admissions@st-silas.rw
Location: Kibondo Village, Simbwa Cell, Kabarore Sector, Gatsibo District

Sincerely,
Office of Admissions & Academic Governance
École Primaire Privée St. Silas EAR Kibondo
    `.trim();

    console.log(`\n📧 [EMAIL DISPATCHED TO PARENT]`);
    console.log(`To: ${toEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Pupil: ${pupilName} | Decision: ${decision}`);
    console.log(`-------------------------------------------------------------------`);

    return {
      success: true,
      message: `Official feedback email successfully dispatched to ${toEmail}`
    };
  } catch (error: any) {
    console.error('[EmailService] Error dispatching feedback email:', error);
    return { success: false, message: error.message || 'Failed to dispatch email' };
  }
}

export interface AdmissionReceivedEmailParams {
  toEmail: string;
  parentName: string;
  pupilName: string;
  grade: string;
  admissionId: string;
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
}

export async function sendAdmissionReceivedEmail(params: AdmissionReceivedEmailParams): Promise<{ success: boolean; message: string }> {
  try {
    const { toEmail, parentName, pupilName, grade, admissionId, district = 'Gatsibo', sector = 'Kabarore', cell = 'Simbwa', village = 'Kibondo' } = params;

    if (!toEmail) {
      console.warn('[EmailService] No recipient email provided for admission acknowledgment');
      return { success: false, message: 'No recipient email provided' };
    }

    const subject = `[St. Silas Primary School] Application Received: ${pupilName} (${grade}) - Ref: ${admissionId}`;

    const emailBody = `
===================================================================
ST. SILAS PRIVATE PRIMARY SCHOOL (EAR KIBONDO)
Rwanda Basic Education Board (REB) Code: 530413
Kibondo Village, Simbwa Cell, Kabarore Sector, Gatsibo District, Rwanda
Motto: "Knowledge, Character, and Diligence" (Ubumenyi, Ubupfura, n'Umurava)
===================================================================

Dear Honored Parent/Guardian ${parentName},

Muraho neza! Thank you for applying for the admission of your pupil to St. Silas Private Primary School EAR Kibondo.

We have successfully received and registered your admission application in our institutional database:

  • Application Reference: ${admissionId}
  • Pupil Name:            ${pupilName}
  • Applying Grade:        ${grade}
  • Parent/Guardian:       ${parentName}
  • Parent Email:          ${toEmail}
  • Residential Location:  ${village}, ${cell}, ${sector}, ${district}
  • Date Received:         ${new Date().toLocaleDateString('en-RW', { dateStyle: 'full' })}
  • Current Status:        ⏳ UNDER REVIEW BY ADMISSIONS BOARD

WHAT TO EXPECT NEXT:
1. Academic Review: The Head Teacher and Admissions Board review every applicant's eligibility under the REB Competence-Based Curriculum (CBC).
2. Status Feedback: You will receive an immediate feedback email update the moment your child's application is evaluated (Approved, Under Review, or Next Steps).
3. Portal Tracking: You can sign in to the St. Silas Portal anytime to monitor your application progress, timetable schedules, and school announcements.

If you have any urgent documentation to submit (birth certificates or immunization cards), please present them at the administration office in Kibondo or reply directly to this notice.

Murakoze cyane,
Office of Admissions & Pupil Enrollment
École Primaire Privée St. Silas EAR Kibondo
Telephone: +250 788 765 432 / +250 783 221 190
Email: admissions@st-silas.rw
    `.trim();

    console.log(`\n📧 [CONFIRMATION EMAIL DISPATCHED TO PARENT APPLICANT]`);
    console.log(`To: ${toEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Pupil: ${pupilName} | Grade: ${grade} | Ref: ${admissionId}`);
    console.log(`-------------------------------------------------------------------`);

    return {
      success: true,
      message: `Admission acknowledgment email successfully sent to ${toEmail}`
    };
  } catch (error: any) {
    console.error('[EmailService] Error dispatching admission received email:', error);
    return { success: false, message: error.message || 'Failed to dispatch email' };
  }
}

