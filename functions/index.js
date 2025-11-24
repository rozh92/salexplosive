const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { setGlobalOptions } = require("firebase-functions/v2");
const { defineString } = require('firebase-functions/params');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');

admin.initializeApp();

setGlobalOptions({ region: 'europe-west3' });

const sendgridKey = defineString('SENDGRID_KEY');

const FROM_EMAIL = 'info@salexplosive.com'; 
const ADMIN_EMAIL = 'info@salexplosive.com';

async function sendEmail(msg, multiple = false) {
    const apiKey = sendgridKey.value();
    if (!apiKey) {
        console.error("SendGrid API Key ontbreekt!");
        return;
    }
    sgMail.setApiKey(apiKey);
    try {
        await sgMail.send(msg, multiple);
    } catch (error) {
        console.error("Fout bij verzenden email:", error);
    }
}

// 1. NIEUWE GEBRUIKER
exports.onNewUserCreate = onDocumentCreated('users/{userId}', async (event) => {
    const snap = event.data;
    if (!snap) return;
    const newUser = snap.data();
    const userId = event.params.userId;

    if (newUser.role === 'owner' && newUser.status === 'pending') {
        const customerMsg = { 
            to: newUser.email, 
            from: { name: 'SalExplosive', email: FROM_EMAIL }, 
            templateId: 'd-b61af4ab15224cde8ac35a9e70b78b2d', 
            dynamic_template_data: { name: newUser.name, company: newUser.company } 
        };
        const adminMsg = { 
            to: ADMIN_EMAIL, 
            from: { name: 'SalExplosive System', email: FROM_EMAIL }, 
            templateId: 'd-669e78ba09364d0d8961f59e602037b0', 
            dynamic_template_data: { companyName: newUser.company, customerName: newUser.name, customerEmail: newUser.email, userId: userId } 
        };
        await Promise.all([ sendEmail(customerMsg), sendEmail(adminMsg) ]);
    } else if (newUser.role !== 'owner') {
        try {
            const link = await admin.auth().generatePasswordResetLink(newUser.email);
            const welcomeMsg = {
                to: newUser.email,
                from: { name: 'SalExplosive Team', email: FROM_EMAIL }, 
                templateId: 'd-248239b4c8f0445c8b64c7b1c4197b57', 
                dynamic_template_data: { 
                    name: newUser.name, 
                    company: newUser.company,
                    role: newUser.role,
                    email: newUser.email,
                    login_url: 'https://www.salexplosive.com',
                    action_url: link 
                }
            };
            await sendEmail(welcomeMsg);
        } catch (e) { console.error(e); }
    }
});

// 2. STATUS UPDATE
exports.onUserStatusChange = onDocumentUpdated('users/{userId}', async (event) => {
    const newData = event.data.after.data();
    const oldData = event.data.before.data();

    if (oldData.status === 'pending' && newData.status === 'approved') {
        const msg = {
            to: newData.email,
            from: { name: 'SalExplosive', email: FROM_EMAIL },
            templateId: 'd-c0612688203e4c8a96791f443e915212',
            dynamic_template_data: { name: newData.name, company: newData.company, login_url: 'https://www.salexplosive.com' }
        };
        await sendEmail(msg);
    }
});

// 3. GOUDEN PITCH
exports.onKnowledgeBasePost = onDocumentCreated('knowledgeBase/{docId}', async (event) => {
    const post = event.data.data();
    const usersRef = admin.firestore().collection('users');
    let q;
    if (post.branchName === '__ORGANIZATION__') {
            q = usersRef.where('companyId', '==', post.companyId);
    } else {
            q = usersRef.where('branchName', '==', post.branchName).where('companyId', '==', post.companyId);
    }
    const usersSnap = await q.get();
    const emails = usersSnap.docs.map(doc => doc.data().email).filter(e => e);

    if (emails.length > 0) {
        const msg = {
            to: emails, 
            from: { name: 'SalExplosive Kennisbank', email: FROM_EMAIL },
            templateId: 'd-c8ace920c5754c2899710f4b132082d4',
            dynamic_template_data: {
                title: post.name,
                promoted_by: post.promotedBy,
                note: post.note,
                link: 'https://www.salexplosive.com/#/team-kennisbank'
            }
        };
        await sendEmail(msg, true);
    }
});

// 4. NIEUWE FACTUUR
exports.onInvoiceCreated = onDocumentCreated('invoices/{invoiceId}', async (event) => {
    const invoice = event.data.data();
    const usersRef = admin.firestore().collection('users');
    const ownerSnap = await usersRef.where('companyId', '==', invoice.companyId).where('role', '==', 'owner').get();
    
    if (!ownerSnap.empty) {
        const owner = ownerSnap.docs[0].data();
        const msg = {
            to: invoice.invoiceEmail || owner.email, 
            from: { name: 'SalExplosive Finance', email: FROM_EMAIL },
            templateId: 'd-41db7caf292b4f7e8d715aac1bad8444',
            dynamic_template_data: {
                name: owner.name,
                company: owner.company,
                invoice_number: invoice.invoiceNumber,
                amount: invoice.amount,
                date: invoice.date,
                download_url: invoice.downloadUrl
            }
        };
        await sendEmail(msg);
    }
});

// 5. EXTRA LICENTIES
exports.requestExtraLicenses = onCall(async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'User must be logged in.');
    const userId = request.auth.uid;
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();
    const { numberOfLicenses, totalCost } = request.data;

    const customerMsg = {
        to: userData.email,
        from: { name: 'SalExplosive Accounts', email: FROM_EMAIL },
        templateId: 'd-1a5d45af7206469c8821a34a6788eccd',
        dynamic_template_data: { name: userData.name, amount: numberOfLicenses, cost: totalCost }
    };
    const adminMsg = {
        to: ADMIN_EMAIL,
        from: { name: 'SalExplosive System', email: FROM_EMAIL },
        templateId: 'd-3e03db7c09a741f5b16762151e82f025',
        dynamic_template_data: { customerName: userData.name, companyName: userData.company, email: userData.email, amount: numberOfLicenses, cost: totalCost, userId: userId }
    };
    await Promise.all([ sendEmail(customerMsg), sendEmail(adminMsg) ]);
    return { success: true };
});

// 6. WACHTWOORD VERGETEN
exports.requestPasswordReset = onCall(async (request) => {
    const email = request.data.email;
    if (!email) throw new HttpsError('invalid-argument', 'Email is required');
    try {
        const link = await admin.auth().generatePasswordResetLink(email);
        const userSnap = await admin.firestore().collection('users').where('email', '==', email).get();
        const name = userSnap.empty ? 'Gebruiker' : userSnap.docs[0].data().name;
        const msg = {
            to: email,
            from: { name: 'SalExplosive Security', email: FROM_EMAIL },
            templateId: 'd-e8ce56efdf1e451b8c9e6b38f1b23616',
            dynamic_template_data: { name: name, reset_url: link }
        };
        await sendEmail(msg);
        return { success: true };
    } catch (error) { return { success: true }; }
});

// 7. WEKELIJKSE REVIEW
exports.sendWeeklyReports = onSchedule({
    schedule: 'every monday 09:00',
    timeZone: 'Europe/Amsterdam',
    region: 'europe-west3'
}, async (event) => {
    const usersRef = admin.firestore().collection('users');
    const snapshot = await usersRef.get();
    const emailsToSend = [];
    for (const doc of snapshot.docs) {
        const user = doc.data();
        if (user.email && user.role !== 'owner') { 
            emailsToSend.push({
                to: user.email,
                from: { name: 'SalExplosive Coach', email: FROM_EMAIL },
                templateId: 'd-4f03c0eb54324cb6ab8ede5fe9531a5b',
                dynamic_template_data: { name: user.name, week_number: new Date().getWeekNumber() }
            });
        }
    }
    if (emailsToSend.length > 0) { await sendEmail(emailsToSend); }
});

Date.prototype.getWeekNumber = function(){
  var d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
  var dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d - yearStart) / 86400000) + 1)/7)
};