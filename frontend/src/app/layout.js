import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './globals.css';
import StoreProvider from '@/store/StoreProvider';
import ToastContainer from '@/components/common/ToastContainer';

export const metadata = {
  title: 'Doctor Tracker | Clinical & RBAC Management System',
  description:
    'Secure administrative portal for managing doctors, patients, analytics, and dynamic role-based access control.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          {children}
          <ToastContainer />
        </StoreProvider>
      </body>
    </html>
  );
}
