import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "../lib/utils";

interface FormField {
  id: string;
  type: "text" | "select" | "checkbox";
  label: string;
  options?: string[];
}

interface DynamicFormProps {
  schema: FormField[];
  onSubmit: (data: any) => void;
  submitLabel?: string;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({ schema, onSubmit, submitLabel = "Submit" }) => {
  // Build dynamic Zod schema
  const zodSchema = z.object(
    schema.reduce((acc, field) => {
      if (field.type === "checkbox") {
        acc[field.id] = z.boolean().default(false);
      } else {
        acc[field.id] = z.string().min(1, `${field.label} is required`);
      }
      return acc;
    }, {} as any)
  );

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(zodSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {schema.map((field) => (
        <div key={field.id} className="space-y-1">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {field.label}
          </label>
          
          {field.type === "text" && (
            <input
              {...register(field.id)}
              className={cn(
                "w-full px-4 py-2 rounded-lg border bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 transition-all",
                errors[field.id] ? "border-red-500 focus:ring-red-500" : "border-zinc-200 dark:border-zinc-800 focus:ring-zinc-900 dark:focus:ring-zinc-50"
              )}
            />
          )}
          
          {field.type === "select" && (
            <select
              {...register(field.id)}
              className={cn(
                "w-full px-4 py-2 rounded-lg border bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 transition-all",
                errors[field.id] ? "border-red-500 focus:ring-red-500" : "border-zinc-200 dark:border-zinc-800 focus:ring-zinc-900 dark:focus:ring-zinc-50"
              )}
            >
              <option value="">Select an option</option>
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          )}
          
          {field.type === "checkbox" && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register(field.id)}
                className="w-4 h-4 rounded border-zinc-200 dark:border-zinc-800"
              />
              <span className="text-sm text-zinc-500">{field.label}</span>
            </div>
          )}
          
          {errors[field.id] && (
            <p className="text-xs text-red-500 mt-1">{errors[field.id]?.message as string}</p>
          )}
        </div>
      ))}
      
      <button
        type="submit"
        className="w-full py-2 rounded-lg bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 font-bold transition-transform active:scale-95"
      >
        {submitLabel}
      </button>
    </form>
  );
};
