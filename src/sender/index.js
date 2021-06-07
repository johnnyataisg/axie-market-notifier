const { database } = require("../firebase/index.js")
const nodemailer = require("nodemailer")

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    service: "gmail",
    secure: true,
    port: 465,
    auth: {
        user: "axiemarketnotifier@gmail.com",
        pass: "jowiesmalldick2021"
    }
})

async function createDocument(email) {
    await database.collection("users").doc(email).set({
        axieIds: []
    })
}

async function getSentAxieIds(email) {
    const document = await database.collection("users").doc(email).get()
    if (!document.exists) {
        await createDocument(email)
        return {
            axieIds: []
        }
    } else {
        return document.data()
    }
}

async function updateSentAxieIds(email, axieIds) {
    await database.collection("users").doc(email).set({
        axieIds
    })
}

module.exports.sendNotification = async function(email, axies) {
    const cachedAxieIds = (await getSentAxieIds(email)).axieIds
    const axieIdsToBeSent = axies.filter(axie => !cachedAxieIds.includes(axie.id)).map(axie => `https://marketplace.axieinfinity.com/axie/${axie.id}`)
    
    try {
        if (axieIdsToBeSent.length > 0) {
            await transporter.sendMail({
                from: "axiemarketnotifier@gmail.com",
                to: email,
                subject: "Axie Marketplace Notifier",
                text: JSON.stringify(axieIdsToBeSent)
            })
            console.log(`Successfully notified ${email} of axie listings.`)
            await updateSentAxieIds(email, axies.map(axie => axie.id))
        }
    } catch (error) {
        console.log("Notification delivery unsuccessful.")
    }
}