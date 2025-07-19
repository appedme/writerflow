import { NextResponse } from "next/server";
import { processScheduledPosts } from "@/src/lib/actions/scheduled-publishing";

// This route should be protected in production with a secret key
export async function GET(request) {
    // In production, you would validate a secret key here
    // const { searchParams } = new URL(request.url);
    // const secret = searchParams.get("secret");
    // if (secret !== process.env.CRON_SECRET) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    try {
        const result = await processScheduledPosts();
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error in scheduled publishing API route:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}