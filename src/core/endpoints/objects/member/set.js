/** @flow */

import type { EndpointConfig } from '../../endpoint';
import operationConstants from '../../../constants/operations';
import type { Member, PaginatedResultParams } from './member';
import utils from '../../../utils';

type CommonParams = {
  channel: string,
};

export type RemoveMembersParams = {
  type: 'delete',
  uuids: (string | { id: string, custom?: empty })[],
} & CommonParams &
  PaginatedResultParams;

export type UpsertMembersParams = {
  type: 'set',
  uuids: (string | { id: string, custom?: any })[],
} & CommonParams &
  PaginatedResultParams;

export type SetMembersParams = RemoveMembersParams | UpsertMembersParams;

export type SetMembersResult = {|
  status: 200,
  data: Member,
  totalCount?: number,
  prev?: string,
  next?: string,
|};

const endpoint: EndpointConfig<SetMembersParams, SetMembersResult> = {
  getOperation: () => operationConstants.PNSetMembersOperation,

  validateParams: (_, params) => {
    if (!params?.channel) {
      return 'Channel cannot be empty';
    }

    if (!params?.uuids || params?.uuids.length === 0) {
      return 'UUIDs cannot be empty';
    }
  },

  usePatch: () => true,

  patchURL: ({ config }, params) => `/v2/objects/${config.subscribeKey}/channels/${utils.encodeString(params.channel)}/uuids`,

  patchPayload: (_, params) => ({
    set: [],
    remove: [],
    [params.type]: params.uuids.map((uuid) => {
      if (typeof uuid === 'string') {
        return {
          uuid: {
            id: uuid,
          },
        };
      } else {
        return {
          uuid: { id: uuid.id },
          custom: uuid.custom,
        };
      }
    }),
  }),

  getRequestTimeout: ({ config }) => config.getTransactionTimeout(),

  isAuthSupported: () => true,

  getAuthToken: ({ tokenManager }) => tokenManager.getToken('member'),

  prepareParams: (_modules, params) => {
    const queryParams = {};

    if (params?.include) {
      queryParams.include = [];

      if (params.include?.customFields) {
        queryParams.include.push('custom');
      }

      if (params.include?.customUUIDFields) {
        queryParams.include.push('uuid.custom');
      }

      if (params.include?.UUIDFields) {
        queryParams.include.push('uuid');
      }

      queryParams.include = queryParams.include.join(',');
    }

    if (params?.include?.totalCount) {
      queryParams.count = true;
    }

    if (params?.page?.next) {
      queryParams.start = params.page?.next;
    }

    if (params?.page?.prev) {
      queryParams.end = params.page?.prev;
    }

    if (params?.filter) {
      queryParams.filter = params.filter;
    }

    if (params?.limit) {
      queryParams.limit = params.limit;
    }

    if (params?.sort) {
      queryParams.sort = Object.entries(params.sort ?? {}).map(([key, value]) => {
        if (value === 'asc' || value === 'desc') {
          return `${key}:${value}`;
        } else {
          return key;
        }
      });
    }

    return queryParams;
  },

  handleResponse: (_, response) => ({
    status: response.status,
    data: response.data,
    totalCount: response.totalCount,
    prev: response.prev,
    next: response.next,
  }),
};

export default endpoint;
