import React from 'react';
import CustomerApp from './components/customer/CustomerApp';
import WelcomePage from './components/customer/WelcomePage';

export default function App() {
  const path = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  const queryTable = searchParams.get('table');

  if (path.startsWith('/staff') || path.startsWith('/nhan-vien')) {
    let staffUrl = process.env.REACT_APP_STAFF_URL;
    if (!staffUrl) {
      if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        const staffPort = process.env.REACT_APP_STAFF_PORT || 3002;
        staffUrl = `http://${window.location.hostname}:${staffPort}`;
      } else {
        staffUrl = '/staff';
      }
    }
    window.location.replace(staffUrl);
    return null;
  }

  let mainContent;

  const matchScan = path.match(/\/scan\/(\d+)/i);
  if (matchScan && matchScan[1]) {
    const tableId = Number(matchScan[1]);
    mainContent = (
      <div className="bg-gray-100 min-h-screen">
        <CustomerApp key={`scan-${tableId}`} initialTableId={tableId} isScanRoute={true} />
      </div>
    );
  } else {

    const matchTable = path.match(/\/table\/([a-zA-Z0-9_-]+)/i);
    if (matchTable && matchTable[1]) {
      const tokenOrId = matchTable[1];
      mainContent = (
        <div className="bg-gray-100 min-h-screen">
          <CustomerApp key={`table-${tokenOrId}`} tokenOrId={tokenOrId} />
        </div>
      );
    } else if (queryTable) {

      mainContent = (
        <div className="bg-gray-100 min-h-screen">
          <CustomerApp key={`query-${queryTable}`} initialTableId={Number(queryTable)} isScanRoute={true} />
        </div>
      );
    } else {

      mainContent = <WelcomePage />;
    }
  }

  return (
    <>
      {mainContent}
    </>
  );
}
