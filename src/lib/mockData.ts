import type { Employee, Task, Client, Transaction, Project, Activity, StrategyPhase } from "@/types";

// DEPRECATED: Production data must come from Supabase.
// Empty exports are kept temporarily to avoid breaking imports while Phase 2 migrates pages/components.
export const mockEmployees: Employee[] = [];
export const mockTasks: Task[] = [];
export const mockClients: Client[] = [];
export const mockTransactions: Transaction[] = [];
export const mockProjects: Project[] = [];
export const mockActivities: Activity[] = [];
export const mockSalesData: Array<{ month: string; current: number; previous: number }> = [];
export const mockActiveUsersData: Array<{ date: string; users: number }> = [];
export const mockStrategyPhases: StrategyPhase[] = [];
