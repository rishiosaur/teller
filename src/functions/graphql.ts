import { GraphQLClient } from 'graphql-request'
import { apiURL, adminToken } from '../config'

export const client = new GraphQLClient(apiURL, {
	headers: {
		admin: adminToken,
	},
})
