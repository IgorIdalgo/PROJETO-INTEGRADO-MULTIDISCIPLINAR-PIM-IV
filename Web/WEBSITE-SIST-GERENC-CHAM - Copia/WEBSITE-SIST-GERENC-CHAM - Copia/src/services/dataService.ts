// Adapter that selects between mock implementation and real backend implementation

import * as api from './apiDataService';

// Força uso exclusivo da API real
export const getTickets = api.getTickets;
export const getTicketById = api.getTicketById;
export const createTicket = api.createTicket;
export const updateTicket = api.updateTicket;
export const deleteTicket = api.deleteTicket;

export const getTicketComments = api.getTicketComments;
export const addComment = api.addComment;

export const getKnowledgeArticles = api.getKnowledgeArticles;
export const getKnowledgeArticleById = api.getKnowledgeArticleById;

export const getUserNotifications = api.getUserNotifications;
export const markNotificationAsRead = api.markNotificationAsRead;
export const createNotification = api.createNotification;

export const getAISuggestions = api.getAISuggestions;

export const getUsers = api.getUsers;
export const getUserById = api.getUserById;
export const createUser = api.createUser;
export const updateUser = api.updateUser;
export const deleteUser = api.deleteUser;

export default {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  getTicketComments,
  addComment,
  getKnowledgeArticles,
  getKnowledgeArticleById,
  getUserNotifications,
  markNotificationAsRead,
  createNotification,
  getAISuggestions,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
