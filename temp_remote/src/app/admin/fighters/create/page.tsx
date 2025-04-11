"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const fighterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  nickname: z.string().optional(),
  weightClass: z.string().optional(),
});

type FighterFormData = z.infer<typeof fighterSchema>;

// Available weight classes for Muay Thai
const WEIGHT_CLASSES = [
  "Strawweight (up to 105 lbs / 47.6 kg)",
  "Mini-Flyweight (105-108 lbs / 47.6-49 kg)",
  "Flyweight (108-112 lbs / 49-50.8 kg)",
  "Super Flyweight (112-115 lbs / 50.8-52.2 kg)",
  "Bantamweight (115-118 lbs / 52.2-53.5 kg)",
  "Super Bantamweight (118-122 lbs / 53.5-55.3 kg)",
  "Featherweight (122-126 lbs / 55.3-57.2 kg)",
  "Super Featherweight (126-130 lbs / 57.2-59 kg)",
  "Lightweight (130-135 lbs / 59-61.2 kg)",
  "Super Lightweight (135-140 lbs / 61.2-63.5 kg)",
  "Welterweight (140-147 lbs / 63.5-66.7 kg)",
  "Super Welterweight (147-154 lbs / 66.7-69.9 kg)",
  "Middleweight (154-160 lbs / 69.9-72.6 kg)",
  "Super Middleweight (160-168 lbs / 72.6-76.2 kg)",
  "Light Heavyweight (168-175 lbs / 76.2-79.4 kg)",
  "Cruiserweight (175-200 lbs / 79.4-90.7 kg)",
  "Heavyweight (200+ lbs / 90.7+ kg)",
];

export default function CreateFighterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FighterFormData>({
    resolver: zodResolver(fighterSchema),
    defaultValues: {
      name: "",
      nickname: "",
      weightClass: "",
    },
  });

  const onSubmit = async (data: FighterFormData) => {
    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/fighters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create fighter");
      }
      
      router.push("/admin/fighters");
    } catch (error) {
      console.error("Error creating fighter:", error);
      setError("Failed to create fighter. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Add New Fighter</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Fighter Name
          </label>
          <input
            id="name"
            type="text"
            {...register("name")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Full name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
            Nickname (optional)
          </label>
          <input
            id="nickname"
            type="text"
            {...register("nickname")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Ring name or alias"
          />
          {errors.nickname && (
            <p className="mt-1 text-sm text-red-600">{errors.nickname.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="weightClass" className="block text-sm font-medium text-gray-700">
            Weight Class (optional)
          </label>
          <select
            id="weightClass"
            {...register("weightClass")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Select weight class</option>
            {WEIGHT_CLASSES.map((weightClass) => (
              <option key={weightClass} value={weightClass}>
                {weightClass}
              </option>
            ))}
          </select>
          {errors.weightClass && (
            <p className="mt-1 text-sm text-red-600">{errors.weightClass.message}</p>
          )}
        </div>
        
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => router.push("/admin/fighters")}
            className="bg-gray-200 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 mr-3"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isLoading ? "Creating..." : "Create Fighter"}
          </button>
        </div>
      </form>
    </div>
  );
} 