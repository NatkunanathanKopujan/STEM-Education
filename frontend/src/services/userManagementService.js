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
  get: async (type, id) => unwrap(await apiClient.get(`${endpointFor(type)}/${id}`)),
  create: async (type, payload) => unwrap(await apiClient.post(endpointFor(type), payload)),
  update: async (type, id, payload) => unwrap(await apiClient.put(`${endpointFor(type)}/${id}`, payload)),
  remove: async (type, id) => unwrap(await apiClient.delete(`${endpointFor(type)}/${id}`)),
  listModules: async (curriculumId) => unwrap(await apiClient.get(`/curriculum/${curriculumId}/modules`)),
  createModule: async (curriculumId, payload) => unwrap(await apiClient.post(`/curriculum/${curriculumId}/modules`, payload)),
  updateModule: async (curriculumId, moduleId, payload) =>
    unwrap(await apiClient.put(`/curriculum/${curriculumId}/modules/${moduleId}`, payload)),
  removeModule: async (curriculumId, moduleId) =>
    unwrap(await apiClient.delete(`/curriculum/${curriculumId}/modules/${moduleId}`)),
};
