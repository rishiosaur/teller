import { GraphQLClient } from 'graphql-request'
import { apiURL, adminToken } from '../config'

console.log(adminToken)

export const client = new GraphQLClient(apiURL, {
	headers: {
		admin: adminToken,
	},
})
