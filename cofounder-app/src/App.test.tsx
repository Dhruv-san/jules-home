import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { NhostProvider } from '@nhost/react';
import { nhost } from './nhost';
import App from './App';

test('renders the landing page with the brand name', () => {
  render(
    <NhostProvider nhost={nhost}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </NhostProvider>
  );
  const brandElements = screen.getAllByText(/CoFound/i);
  expect(brandElements.length).toBeGreaterThan(0);
});

