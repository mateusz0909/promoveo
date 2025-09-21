import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { toast } from 'sonner';
import { MoreVertical } from 'lucide-react';
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { DevicePhoneMobileIcon, DeviceTabletIcon } from '@heroicons/react/24/solid';
import { formatDistanceToNow } from 'date-fns';

interface Project {
  id: string;
  name: string;
  inputAppName: string;
  createdAt: string;
  updatedAt: string;
  language: string;
  device: string;
}

export function ProjectList() {
  const auth = useAuth();
  const session = auth?.session ?? null;
  const { setParts } = useBreadcrumb();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setParts([{ name: 'Projects' }]);
  }, [setParts]);

  useEffect(() => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }

        const data = await response.json();
        setProjects(data);
      } catch (error) {
        console.error(error);
        toast.error('Could not load your projects.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [session]);

  const handleDeleteProject = async (projectId: string) => {
    if (!session) return;

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      setProjects(projects.filter(p => p.id !== projectId));
      toast.success('Project deleted successfully.');
    } catch (error) {
      console.error(error);
      toast.error('Could not delete the project.');
    }
  };

  // Pagination calculations
  const sortedProjects = projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const totalPages = Math.ceil(sortedProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProjects = sortedProjects.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
      
        <p className="ml-2">Loading projects </p>
          <Spinner variant='bars' />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Welcome to Promoveo</h2>
        <p>Please log in to manage your projects.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Button asChild>
          <Link to="/new-project">New Project</Link>
        </Button>
      </div>
      {projects.length > 0 ? (
        <div className="space-y-4">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <Link to={`/project/${project.id}`} className="font-medium hover:underline flex items-center">
                      {project.device === 'iPad' ? <DeviceTabletIcon className="h-5 w-5 mr-2" /> : <DevicePhoneMobileIcon className="h-5 w-5 mr-2" />}
                      {project.inputAppName}
                    </Link>
                  </TableCell>
                  <TableCell>{project.device || 'iPhone'}</TableCell>
                  <TableCell>{project.language || 'English'}</TableCell>
                  <TableCell>{formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500">
                              Delete Project
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent >
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your project
                                and remove your data from our servers.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className='bg-destructive  hover:bg-destructive/80' onClick={() => handleDeleteProject(project.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#" 
                      size="default"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) handlePageChange(currentPage - 1);
                      }}
                      className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          href="#"
                          size="icon"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(pageNumber);
                          }}
                          isActive={currentPage === pageNumber}
                          className="cursor-pointer"
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext 
                      href="#" 
                      size="default"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) handlePageChange(currentPage + 1);
                      }}
                      className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center border-2 border-dashed border-muted rounded-lg p-12">
          <h3 className="text-xl font-semibold">No projects yet</h3>
          <p className="text-muted-foreground mt-2">Get started by creating a new project.</p>
        </div>
      )}
    </div>
  );
}
