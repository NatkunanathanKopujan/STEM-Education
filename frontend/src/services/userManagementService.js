import { apiClient } from './apiClient';

const unwrap = (response) => response.data?.data ?? response.data;

const endpoints = {
  teacher: '/teacher',
  student: '/student',
  curriculum: '/curriculum',
};

const endpointFor = (type) => endpoints[type];

export const userManagementService = {
  list: async (type, params) => unwrap(await apiClient.get(endpointFor(type), { params })),
  create: async (type, payload) => unwrap(await apiClient.post(endpointFor(type), payload)),
  update: async (type, id, payload) => unwrap(await apiClient.put(`${endpointFor(type)}/${id}`, payload)),
  remove: async (type, id) => unwrap(await apiClient.delete(`${endpointFor(type)}/${id}`)),
};
