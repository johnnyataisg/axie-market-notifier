const { database } = require("./firebase/index.js")

module.exports.truncateDb = function() {
    const ref = database.collection("users")
    ref.onSnapshot((snapshot) => {
        snapshot.docs.forEach((doc) => {
            ref.doc(doc.id).delete()
        })
    })
}