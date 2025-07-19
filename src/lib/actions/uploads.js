"use server";

import { nanoid } from "nanoid";
import { writeFile } from "fs/promises";
import path from "path";
import { stackServerApp } from "@/src/stack";

/**
 * Uploads an image file to the server
 * @param {FormData} formData - Form data containing the image file
 * @returns {Promise<{url: string}>} - URL of the uploaded image
 */
export async function uploadImage(formData) {
    const user = await stackServerApp.getUser();
    if (!user) {
        throw new Error("Unauthorized");
    }

    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
        throw new Error("No file provided");
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
        throw new Error("Invalid file type. Only JPEG, PNG, GIF, and WebP are supported.");
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        throw new Error("File size exceeds 5MB limit");
    }

    try {
        // Generate a unique filename
        const fileExtension = file.name.split(".").pop();
        const fileName = `${nanoid()}.${fileExtension}`;

        // Create directory structure if it doesn't exist
        const uploadDir = path.join(process.cwd(), "public/uploads");
        const userDir = path.join(uploadDir, user.id);

        try {
            await writeFile(path.join(userDir, fileName), Buffer.from(await file.arrayBuffer()));
        } catch (error) {
            // If directory doesn't exist, create it and try again
            if (error.code === "ENOENT") {
                const { mkdir } = require("fs/promises");
                await mkdir(userDir, { recursive: true });
                await writeFile(path.join(userDir, fileName), Buffer.from(await file.arrayBuffer()));
            } else {
                throw error;
            }
        }

        // Return the URL to the uploaded image
        return { url: `/uploads/${user.id}/${fileName}` };
    } catch (error) {
        console.error("Error uploading image:", error);
        throw new Error("Failed to upload image");
    }
}