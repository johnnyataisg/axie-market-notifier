const validator = require("email-validator")
const { prompt } = require("enquirer")
const { GraphQLClient } = require("graphql-request")
const schedule = require("node-schedule")
const { calculateGeneScore, getCompleteGeneMap } = require("./genes/index.js")
const { GET_LISTED_AXIES_WITH_CRITERIA } = require("./graphql/query.js")
const { sendNotification } = require("./sender/index.js")
const bodyParts = require("../static/body-parts.json")

const ENDPOINT_URL = "https://axieinfinity.com/graphql-server-v2/graphql"
const client = new GraphQLClient(ENDPOINT_URL)

var bodyPartsMap = {}
var partsValueMap = {}

function loadBodyParts() {
    bodyParts.forEach(bodyPart => {
        if (bodyPart.type in bodyPartsMap) {
            bodyPartsMap[bodyPart.type].push(bodyPart)
        } else {
            bodyPartsMap[bodyPart.type] = []
        }
        partsValueMap[bodyPart.name] = bodyPart.partId
    })
}

async function searchAxies(userInput) {
    const parts = []
    if (userInput.back !== "No selection") {
        parts.push(partsValueMap[userInput.back])
    }
    if (userInput.mouth !== "No selection") {
        parts.push(partsValueMap[userInput.mouth])
    }
    if (userInput.horn !== "No selection") {
        parts.push(partsValueMap[userInput.horn])
    }
    if (userInput.tail !== "No selection") {
        parts.push(partsValueMap[userInput.tail])
    }

    const variables = {
        auctionType: "Sale",
        criteria: {
            parts,
            classes: [userInput.targetClass],
            pureness: [userInput.minPureness],
            breedCount: [userInput.minBreedCount, userInput.maxBreedCount]
        },
        sort: "PriceAsc",
        size: 100
    }

    try {
        const { results } = (await client.request(GET_LISTED_AXIES_WITH_CRITERIA, variables)).axies
        const filteredAxies = results.filter((axie) => {
            const priceEth = Number(BigInt(axie.auction.currentPrice) / BigInt(100000000000000)) / 10000
            const geneMap = getCompleteGeneMap(axie.genes)
            const geneScore = calculateGeneScore(geneMap)
            return priceEth < userInput.budget && geneScore >= 85
        })
        return filteredAxies
    } catch (error) {
        console.log("Axie infinity servers are having problems.")
        process.kill(process.pid, "SIGINT")
    }
}

async function main() {
    loadBodyParts()

    const userInput = await prompt([
        {
            type: "input",
            name: "email",
            message: "What is your email?",
            validate: (email) => !!email && validator.validate(email)
        },
        {
            type: "select",
            name: "targetClass",
            message: "Select an axie class",
            choices: ["Aquatic", "Beast", "Bird", "Bug", "Dawn", "Dusk", "Mech", "Plant", "Reptile"]
        },
        {
            type: "numeral",
            name: "minBreedCount",
            message: "Enter minimum breed count (0-7)",
            validate: (count) => count >= 0 && count <= 7
        },
        {
            type: "numeral",
            name: "maxBreedCount",
            message: "Enter maximum breed count (0-7)",
            validate: (count) => count >= 0 && count <= 7
        },
        {
            type: "numeral",
            name: "minPureness",
            message: "Enter minimum pureness (0-6)",
            validate: (count) => count >= 0 && count <= 6
        },
        {
            type: "select",
            name: "back",
            message: "Select desired back",
            choices: ["No selection"].concat(bodyPartsMap.back.map(part => part.name).sort())
        },
        {
            type: "select",
            name: "mouth",
            message: "Select desired mouth",
            choices: ["No selection"].concat(bodyPartsMap.mouth.map(part => part.name).sort())
        },
        {
            type: "select",
            name: "horn",
            message: "Select desired horn",
            choices: ["No selection"].concat(bodyPartsMap.horn.map(part => part.name).sort())
        },
        {
            type: "select",
            name: "tail",
            message: "Select desired tail",
            choices: ["No selection"].concat(bodyPartsMap.tail.map(part => part.name).sort())
        },
        {
            type: "numeral",
            name: "budget",
            message: "Enter max price in ETH",
            validate: (price) => price > 0
        }
    ])

    schedule.scheduleJob("*/30 * * * * *", async () => {
        const foundAxies = await searchAxies(userInput)
        await sendNotification(userInput.email, foundAxies)
    })
}

main()