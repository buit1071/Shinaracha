// lib-server/currentUser.ts
import type { CurrentUser } from "../interfaces/master";

let currentUser: CurrentUser | null = null;

export function setCurrentUser(user: CurrentUser) {
    currentUser = user;
}

export function getCurrentUser(): CurrentUser | null {
    return currentUser;
}

export function clearCurrentUser() {
    currentUser = null;
}