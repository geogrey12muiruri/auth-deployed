// app/auth/login/layout.js
import React from 'react';
import Link from 'next/link';
import styles from './Login.module.css';

const LoginLayout = ({ children }) => {
  return (
    <div className={styles.container}>
      <div className={styles.loginFormWrapper}>
        {children}  {/* This will be the login form component */}
      </div>
      <div className={styles.extraLinks}>
        <Link href="/auth/forgot-password">Forgot Password?</Link>
        <Link href="/auth/register">Don't have an account? Sign up</Link>
      </div>
    </div>
  );
};

export default LoginLayout;
