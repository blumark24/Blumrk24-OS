import { supabase } from "@/lib/supabase";
import type { Task } from "@/types";

export async function fetchTasks(): Promise<{ data: Task[] | null; error: any }>{
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });
  return { data: data as Task[] | null, error };
}

export async function fetchTaskById(id: string){
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .single();
  return { data, error };
}

export async function createTask(payload: Partial<Task>){
  const { data, error } = await supabase
    .from("tasks")
    .insert([payload])
    .select()
    .single();
  return { data, error };
}

export async function updateTask(id: string, payload: Partial<Task>){
  const { data, error } = await supabase
    .from("tasks")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  return { data, error };
}

export async function deleteTask(id: string){
  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .select();
  return { data, error };
}
