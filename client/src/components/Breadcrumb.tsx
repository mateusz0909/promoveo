import { Link } from "react-router-dom";
import {
  Breadcrumb as ShadcnBreadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useBreadcrumb } from "@/context/BreadcrumbContext";
import React from 'react';
import { Home } from 'lucide-react';

export function Breadcrumb() {
  const { parts } = useBreadcrumb();

  return (
    <ShadcnBreadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink className="flex items-center gap-1" asChild>
            <Link to="/"><Home className="h-4 w-4" /> Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {parts.length > 0 && <BreadcrumbSeparator />}
        {parts.map((part, index) => {
          const isLast = index === parts.length - 1;
          return (
            <React.Fragment key={index}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{part.name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={part.path || '#'}>{part.name}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < parts.length - 1 && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </ShadcnBreadcrumb>
  );
}