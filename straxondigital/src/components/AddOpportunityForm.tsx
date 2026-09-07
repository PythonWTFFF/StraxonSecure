import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { EdTechOpportunity } from "@/pages/Opportunities";

const opportunitySchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters."),
  category: z.string().min(2, "Category is required.").default("EdTech"),
  description: z.string().min(20, "Description must be at least 20 characters."),
  severity_score: z.coerce.number().min(0).max(10),
  tam_score: z.coerce.number().min(0).max(10),
  whitespace_score: z.coerce.number().min(0).max(10),
  frequency_score: z.coerce.number().min(0).max(10),
  itch_score: z.coerce.number().min(0).max(100),
  solution_concept: z.string().min(10, "Solution concept is required."),
  moat: z.string().min(5, "Moat is required."),
  monetization_model: z.string().min(5, "Monetization model is required."),
  target_audience: z.string().min(5, "Target audience is required."),
});

type OpportunityFormValues = z.infer<typeof opportunitySchema>;

interface AddOpportunityFormProps {
  onSuccess: (newOpportunity: EdTechOpportunity) => void;
  onCancel: () => void;
}

export function AddOpportunityForm({ onSuccess, onCancel }: AddOpportunityFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OpportunityFormValues>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      title: "",
      category: "EdTech",
      description: "",
      severity_score: 5,
      tam_score: 5,
      whitespace_score: 5,
      frequency_score: 5,
      itch_score: 50,
      solution_concept: "",
      moat: "",
      monetization_model: "",
      target_audience: "",
    },
  });

  async function onSubmit(data: OpportunityFormValues) {
    setIsSubmitting(true);
    try {
      const { data: insertedData, error } = await supabase
        .from("edtech_opportunities")
        .insert([data])
        .select()
        .single();

      if (error) throw error;

      toast.success("Opportunity added successfully!");
      onSuccess(insertedData as EdTechOpportunity);
    } catch (error: unknown) {
      console.error("Error adding opportunity:", error);
      const message = error instanceof Error ? error.message : "Failed to add opportunity";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title (The "Why" Question)</FormLabel>
              <FormControl>
                <Input placeholder="Why do fresh graduates..." className="bg-slate-950/60 border-slate-800" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Problem Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Companies hiring fresh graduates discover..." 
                  className="bg-slate-950/60 border-slate-800 min-h-[80px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <FormField
            control={form.control}
            name="severity_score"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Severity</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" className="bg-slate-950/60 border-slate-800" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tam_score"
            render={({ field }) => (
              <FormItem>
                <FormLabel>TAM</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" className="bg-slate-950/60 border-slate-800" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="whitespace_score"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Whitespace</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" className="bg-slate-950/60 border-slate-800" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="frequency_score"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Frequency</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" className="bg-slate-950/60 border-slate-800" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="itch_score"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ITCH (1-100)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" className="bg-slate-950/60 border-slate-800 text-cyan-400 font-bold" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="solution_concept"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Solution Concept</FormLabel>
              <FormControl>
                <Textarea className="bg-slate-950/60 border-slate-800" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="moat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Defensive Moat</FormLabel>
                <FormControl>
                  <Input className="bg-slate-950/60 border-slate-800" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="monetization_model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monetization Model</FormLabel>
                <FormControl>
                  <Input className="bg-slate-950/60 border-slate-800" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="target_audience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Audience</FormLabel>
              <FormControl>
                <Input className="bg-slate-950/60 border-slate-800" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-cyan-600 hover:bg-cyan-500 text-white">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Opportunity
          </Button>
        </div>
      </form>
    </Form>
  );
}
