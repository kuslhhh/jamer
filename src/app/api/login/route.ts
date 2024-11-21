import dbConnect from "@/lib/dbConnect";
import User from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { User as userType } from "firebase/auth";

const jwt_secret = process.env.JWT_SECRET || "";
export async function POST(req: NextRequest) {
  try {
    const data: userType = await req.json();
    await dbConnect();
    const isAlready = await User.findOne({ email: data.email });
    if (isAlready) {
      await proceed(isAlready);
      return NextResponse.json(
        { success: true, data: isAlready.toObject() },
        { status: 200 }
      );
    } else {
      const user = await User.create({
        username: data.email?.split("@gmail.com")[0],
        name: data.displayName,
        email: data.email,
        imageUrl: data.photoURL,
      });
      if (user) {
        await proceed(user);
        return NextResponse.json(
          { success: true, data: user },
          { status: 200 }
        );
      }
    }
    return NextResponse.json({ success: false, data: {} }, { status: 500 });
  } catch (error: any) {
    console.log(error);

    return NextResponse.json(
      { success: false, data: {}, message: error?.message },
      { status: 500 }
    );
  }
}

const proceed = (saved: any) => {
  const accessToken = jwt.sign({ userId: saved._id }, jwt_secret, {
    expiresIn: "7d",
  });

  cookies().set("vibeId", accessToken, {
    path: "/",
    httpOnly: true,
    sameSite: "strict",
    secure: true,
  });
};