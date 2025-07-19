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

      // Ensure all required fields are present
      if (!userData.name) {
        throw new Error("Name is required for user creation");
      }

      if (!userData.email) {
        throw new Error("Email is required for user creation");
      }

      const newUser = {
        id: userId,
        stackUserId,
        name: userData.name,
        email: userData.email,
        imageUrl: userData.imageUrl || null,
        bio: userData.bio || null,
        website: userData.website || null,
        location: userData.location || null,
        twitter: userData.twitter || null,
        github: userData.github || null,
        linkedin: userData.linkedin || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(users).values(newUser);

      console.log(`User created successfully: ${userId} (Stack ID: ${stackUserId})`);
      return newUser;
    }
  } catch (error) {
    console.error("Error creating/updating user:", error);
    throw new Error(`Failed to create or update user: ${error.message}`);
  }
}

export async function registerUser(formData) {
  try {
    // Extract form data
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    // Validate required fields
    if (!name || !email || !password || !confirmPassword) {
      throw new Error("All fields are required");
    }

    // Validate email format
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email address");
    }

    // Validate password length
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    // Validate password match
    if (password !== confirmPassword) {
      throw new Error("Passwords do not match");
    }

    // Create user in Stack authentication
    // Note: The actual user creation in our database happens in the AuthProvider
    // when the Stack auth state changes and calls createOrUpdateUser

    // We're not directly creating the user here because that's handled by the Stack client
    // in the AuthProvider component. This server action is primarily for validation
    // and any additional processing needed before registration.

    return {
      success: true,
      message: "Validation successful. User will be created via Stack authentication."
    };
  } catch (error) {
    console.error("Error registering user:", error);
    return {
      success: false,
      error: error.message || "Failed to register user"
    };
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

  // Server-side validation
  if (!username || username.trim() === "") {
    throw new Error("Username is required");
  }

  if (username.length < 3) {
    throw new Error("Username must be at least 3 characters");
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    throw new Error("Username can only contain letters, numbers, and underscores");
  }

  // Check if username is already taken by another user
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (existingUser.length > 0 && existingUser[0].stackUserId !== user.id) {
    throw new Error("Username is already taken");
  }

  // Validate website URL if provided
  if (website && !website.match(/^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/)) {
    throw new Error("Please enter a valid website URL");
  }

  // Validate bio length
  if (bio && bio.length > 500) {
    throw new Error("Bio cannot exceed 500 characters");
  }

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

    return { success: true };
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

export async function getProfile() {
  try {
    const user = await stackServerApp.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const userProfile = await getUserByStackId(user.id);

    if (!userProfile) {
      return { success: false, error: "Profile not found" };
    }

    return {
      success: true,
      profile: {
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.email,
        username: userProfile.username,
        bio: userProfile.bio,
        website: userProfile.website,
        location: userProfile.location,
        twitter: userProfile.twitter,
        github: userProfile.github,
        linkedin: userProfile.linkedin,
        imageUrl: userProfile.imageUrl,
        createdAt: userProfile.createdAt,
        updatedAt: userProfile.updatedAt
      }
    };
  } catch (error) {
    console.error("Error fetching profile:", error);
    return { success: false, error: "Failed to fetch profile" };
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