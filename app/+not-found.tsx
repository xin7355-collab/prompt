import React from 'react';
import { Redirect } from 'expo-router';

/**
 * Any URL that matches no route lands on the library rather than a dead-end error
 * screen. This also covers the standalone web build: when the page is opened straight
 * off disk the initial path is the file's own path, which matches nothing.
 */
export default function NotFound() {
  return <Redirect href="/" />;
}
