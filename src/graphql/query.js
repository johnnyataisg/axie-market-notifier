const { gql } = require("graphql-request")

module.exports.GET_LISTED_AXIES_WITH_CRITERIA = gql`
    query GetAxieBriefList($auctionType: AuctionType, $criteria: AxieSearchCriteria, $sort: SortBy, $size: Int) {
        axies(auctionType: $auctionType, criteria: $criteria, sort: $sort, size: $size) {
            total
            results {
                ...AxieBrief
            }
        }
    }
    fragment AxieBrief on Axie {
        id
        name
        class
        breedCount
        genes
        auction {
        currentPrice
        currentPriceUSD
        }
    }
`