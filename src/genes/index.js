const binarytraits = require("../../static/binary-traits.json")
const bodyParts = require("../../static/body-parts.json")
const classGeneMap = require("../../static/class-gene-map.json")
const geneColorMap = require("../../static/gene-color-map.json")
const regionGeneMap = require("../../static/region-gene-map.json")


const bodyPartsMap = {}
bodyParts.forEach(bodyPart => {
    bodyPartsMap[bodyPart.partId] = bodyPart
})

function strMul(str, num) {
    var s = ""
    for (var i = 0; i < num; i++) {
        s += str
    }
    return s
}

function genesToBin(genes) {
    var genesString = genes.toString(2)
    genesString = strMul("0", 256 - genesString.length) + genesString
    return genesString
}


function getRegionFromGroup(group) {
    let regionBin = group.slice(8, 13)
    if (regionBin in regionGeneMap) {
        return regionGeneMap[regionBin]
    }
    return "Unknown Region"
}

function getClassFromGroup(group) {
    let bin = group.slice(0, 4)
    if (!(bin in classGeneMap)) {
        return "Unknown Class"
    }
    return classGeneMap[bin]
}

function getPatternsFromGroup(group) {
    return { d: group.slice(2, 8), r1: group.slice(8, 14), r2: group.slice(14, 20) }
}

function getColor(bin, cls) {
    let color
    if (bin == "0000") {
        color = "ffffff"
    } else if (bin == "0001") {
        color = "7a6767"
    } else {
        color = geneColorMap[cls][bin]
    }
    return color
}

function getColorsFromGroup(group, cls) {
    return {
        d: getColor(group.slice(20, 24), cls),
        r1: getColor(group.slice(24, 28), cls),
        r2: getColor(group.slice(28, 32), cls)
    }
}

function getPartName(cls, part, region, binary, skinBinary = "00") {
    let trait
    if (binary in binarytraits[cls][part]) {
        if (skinBinary == "11") {
            trait = binarytraits[cls][part][binary]["mystic"]
        } else if (skinBinary == "10") {
            trait = binarytraits[cls][part][binary]["xmas"]
        } else if (region in binarytraits[cls][part][binary]) {
            trait = binarytraits[cls][part][binary][region]
        } else if ("global" in binarytraits[cls][part][binary]) {
            trait = binarytraits[cls][part][binary]["global"]
        } else {
            trait = "UNKNOWN Regional " + cls + " " + part
        }
    } else {
        trait = "UNKNOWN " + cls + " " + part
    }
    return trait
}

function getPartsFromGroup(part, group, region,) {
    let skinBinary = group.slice(0, 2)
    let mystic = skinBinary == "11"
    let dClass = classGeneMap[group.slice(2, 6)]
    let dBin = group.slice(6, 12)
    let dName = getPartName(dClass, part, region, dBin, skinBinary)

    let r1Class = classGeneMap[group.slice(12, 16)]
    let r1Bin = group.slice(16, 22)
    let r1Name = getPartName(r1Class, part, region, r1Bin)

    let r2Class = classGeneMap[group.slice(22, 26)]
    let r2Bin = group.slice(26, 32)
    let r2Name = getPartName(r2Class, part, region, r2Bin)

    return {
        d: getPartFromName(part, dName),
        r1: getPartFromName(part, r1Name),
        r2: getPartFromName(part, r2Name),
        mystic: mystic
    }
}

function getTraits(genes) {
    var groups = [genes.slice(0, 32), genes.slice(32, 64), genes.slice(64, 96), genes.slice(96, 128), genes.slice(128, 160), genes.slice(160, 192), genes.slice(192, 224), genes.slice(224, 256)]
    let cls = getClassFromGroup(groups[0])
    let region = getRegionFromGroup(groups[0])
    let pattern = getPatternsFromGroup(groups[1])
    let color = getColorsFromGroup(groups[1], groups[0].slice(0, 4))
    let eyes = getPartsFromGroup("eyes", groups[2], region)
    let mouth = getPartsFromGroup("mouth", groups[3], region)
    let ears = getPartsFromGroup("ears", groups[4], region)
    let horn = getPartsFromGroup("horn", groups[5], region)
    let back = getPartsFromGroup("back", groups[6], region)
    let tail = getPartsFromGroup("tail", groups[7], region)
    return {
        cls: cls,
        region: region,
        pattern: pattern,
        color: color,
        eyes: eyes,
        mouth: mouth,
        ears: ears,
        horn: horn,
        back: back,
        tail: tail
    }
}

function getPartFromName(traitType, partName) {
    let traitId = traitType.toLowerCase() + "-" + partName.toLowerCase().replace(/\s/g, "-").replace(/[\?'\.]/g, "")
    return bodyPartsMap[traitId]
}

module.exports.getCompleteGeneMap = function(genesString) {
    return getTraits(genesToBin(BigInt(genesString)))
}

module.exports.calculateGeneScore = function(geneMap) {
    var score = 100
    const lessers = ["eyes", "ears"]
    const greaters = ["mouth", "horn", "back", "tail"]

    lessers.forEach(part => {
        if (geneMap[part].d.class !== geneMap[part].r1.class) {
            score -= 5
        }
        if (geneMap[part].d.class !== geneMap[part].r2.class) {
            score -= 1
        }
    })
    greaters.forEach(part => {
        if (geneMap[part].d.name !== geneMap[part].r1.name) {
            score -= 10
        }
        if (geneMap[part].d.name !== geneMap[part].r2.name) {
            score -= 2
        }
    })
    return score
}