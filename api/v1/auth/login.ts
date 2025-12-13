import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByEmail } from '../../../utils/db';
import { validateLoginCredentials } from '../../../utils/validation';
import { serialize } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret'; // Replace with a strong, randomly generated secret in production
const COOKIE_NAME = 'auth_token';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { email, password } = req.body;

    // Validate credentials
    const validationResult = validateLoginCredentials(email, password);
    if (!validationResult.isValid) {
      return res.status(400).json({ message: validationResult.message });
    }

    // Find user by email
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '1h', // Adjust as needed
    });

    // Set JWT as a cookie
    const serializedCookie = serialize(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Set to true in production
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60, // 1 hour
    });

    res.setHeader('Set-Cookie', serializedCookie);

    // Return success response
    return res.status(200).json({ message: 'Login successful' });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}