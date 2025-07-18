"use server";

import { db } from "@/src/lib/db";
import { users } from "@/src/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { stackServerApp } from "@/src/stack";
import { nanoid } from "nanoid";

export async function createOrUpdateUser(stackUserId, userData) {
  try {
    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.stackUserId, stackUserId))
      .limit(1);

    if (existingUser.length > 0) {
      // Update existing user
      await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(users.stackUserId, stackUserId));

      return existingUser[0];
    } else {
      // Create new user
      const userId = nanoid();
      const newUser = {
        id: userId,
        stackUserId,
        ...userData,
      };

      await db.insert(users).values(newUser);
      return newUser;
    }
  } catch (error) {
    console.error("Error creating/updating user:", error);
    throw new Error("Failed to create or update user");
  }
}

export async function registerUser(formData) {
  try {
    // This function is called after Stack authentication has created the user
    // The actual user creation in our database happens in the AuthProvider
    // when the Stack auth state changes

    // We can perform additional validation or processing here if needed
    const name = formData.get("name");
    const email = formData.get("email");

    if (!name || !email) {
      throw new Error("Name and email are required");
    }

    // The actual user creation in the database is handled by the AuthProvider
    // when the Stack auth state changes and calls createOrUpdateUser

    return { success: true };
  } catch (error) {
    console.error("Error registering user:", error);
    throw new Error("Failed to register user");
  }
}

export async function updateUserProfile(formData) {
  const user = await stackServerApp.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const username = formData.get("username");
  const bio = formData.get("bio");
  const website = formData.get("website");
  const location = formData.get("location");
  const twitter = formData.get("twitter");
  const github = formData.get("github");
  const linkedin = formData.get("linkedin");

  try {
    await db
      .update(users)
      .set({
        username,
        bio,
        website,
        location,
        twitter,
        github,
        linkedin,
        updatedAt: new Date(),
      })
      .where(eq(users.stackUserId, user.id));

    revalidatePath("/profile");
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw new Error("Failed to update profile");
  }
}

export async function getUserByStackId(stackUserId) {
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.stackUserId, stackUserId))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Error fetching user by stack ID:", error);
    return null;
  }
}

export async function getUserByUsername(username) {
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Error fetching user by username:", error);
    return null;
  }
}