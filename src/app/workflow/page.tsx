import { Metadata } from 'next/types';

import { productProfile } from './product-profile';
import SidebarLayout from './layouts/sidebar-layout';
import Workflow from './components/workflow';

export const metadata: Metadata = {
  title: productProfile.name,
  description: productProfile.description,
};

export default async function Page() {
  return (
    <SidebarLayout>
      <Workflow />
    </SidebarLayout>
  );
}
