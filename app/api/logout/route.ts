"use server";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        await cookies().delete("access_token");
        await cookies().delete("refresh_token");
        return NextResponse.json({ message: "success" });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ message: error });
    }
}
