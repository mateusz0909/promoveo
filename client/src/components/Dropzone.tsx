
import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, X } from 'lucide-react';
import { Button } from './ui/button';

interface DropzoneProps {
  onFilesChange: (files: File[]) => void;
  initialFiles?: File[];
  device?: string;
}

export function Dropzone({ onFilesChange, initialFiles = [], device = 'iPhone' }: DropzoneProps) {
  const [files, setFiles] = useState<File[]>(initialFiles);
  const [errors, setErrors] = useState<string[]>([]);

  // Clear errors when device changes as validation criteria change
  useEffect(() => {
    console.log(`Device changed to: ${device}, clearing validation errors`);
    setErrors([]);
  }, [device]);

  const validateFile = (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          console.log(`Validating ${file.name}: ${img.width}x${img.height} (device: ${device})`);
          
          const aspectRatio = img.width / img.height;
          const targetAspectRatio = device === 'iPad' ? 2048 / 2732 : 9 / 19.5;
          const tolerance = 0.15; // Increased tolerance from 0.1 to 0.15
          
          console.log(`Aspect ratios - File: ${aspectRatio.toFixed(4)}, Target: ${targetAspectRatio.toFixed(4)}, Difference: ${Math.abs(aspectRatio - targetAspectRatio).toFixed(4)}`);
          
          if (Math.abs(aspectRatio - targetAspectRatio) > tolerance) {
            const errorMsg = `Invalid aspect ratio for ${file.name}. Expected ${device} portrait (${targetAspectRatio.toFixed(3)}), got ${aspectRatio.toFixed(3)}. Please use portrait screenshots for the selected device.`;
            console.log(`Validation failed: ${errorMsg}`);
            resolve(errorMsg);
          } else {
            console.log(`Validation passed for ${file.name}`);
            resolve(null);
          }
        } catch (error) {
          console.error(`Error during validation of ${file.name}:`, error);
          resolve(`Error validating file ${file.name}`);
        } finally {
          URL.revokeObjectURL(img.src); // Clean up
        }
      };
      
      img.onerror = (error) => {
        console.error(`Error loading image ${file.name}:`, error);
        URL.revokeObjectURL(img.src); // Clean up
        resolve(`Error reading file ${file.name}`);
      };
      
      // Set src after setting up event handlers
      img.src = URL.createObjectURL(file);
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    console.log(`Processing ${acceptedFiles.length} files for ${device} device`);
    setErrors([]);
    const newErrors: string[] = [];
    const processedFiles: File[] = [...files];

    const compressionOptions = {
      initialQuality: 0.6,
      maxWidthOrHeight: 1290,
      useWebWorker: true,
      fileType: 'image/jpeg',
    };

    // Process files sequentially to avoid race conditions
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      console.log(`Processing file ${i + 1}/${acceptedFiles.length}: ${file.name}`);
      
      try {
        const error = await validateFile(file);
        if (error) {
          console.log(`Validation failed for ${file.name}: ${error}`);
          newErrors.push(error);
        } else {
          console.log(`Validation passed for ${file.name}, starting compression`);
          try {
            const compressedFile = await imageCompression(file, compressionOptions);
            const originalNameWithoutExt = file.name.split('.').slice(0, -1).join('.');
            const newName = `${originalNameWithoutExt}.jpg`;
            const renamedFile = new File([compressedFile], newName, { 
              type: 'image/jpeg', 
              lastModified: Date.now() 
            });
            processedFiles.push(renamedFile);
            console.log(`Successfully processed ${file.name} -> ${newName}`);
          } catch (compressionError) {
            console.error('Error compressing file:', compressionError);
            newErrors.push(`Could not process file: ${file.name}`);
          }
        }
      } catch (processingError) {
        console.error(`Unexpected error processing ${file.name}:`, processingError);
        newErrors.push(`Unexpected error processing file: ${file.name}`);
      }
    }

    if (newErrors.length > 0) {
      console.log(`Setting ${newErrors.length} errors:`, newErrors);
      setErrors(newErrors);
    } else {
      console.log('All files processed successfully');
    }

    setFiles(processedFiles);
    onFilesChange(processedFiles);
  }, [files, onFilesChange, device]);

  const removeFile = (fileToRemove: File) => {
    const updatedFiles = files.filter(file => file !== fileToRemove);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] },
    multiple: true,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <p>Drag 'n' drop some files here, or click to select files</p>
        )}
      </div>

      {files.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {files.map((file, i) => (
            <div key={i} className="relative group">
              <img
                src={URL.createObjectURL(file)}
                alt={`preview ${i}`}
                className="rounded-md object-cover w-full h-full"
                onLoad={e => URL.revokeObjectURL(e.currentTarget.src)}
              />
              <div className="absolute top-1 right-1">
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-6 w-6 opacity-75 group-hover:opacity-100"
                  onClick={() => removeFile(file)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {errors.length > 0 && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Invalid Files</AlertTitle>
          <AlertDescription>
            <ul className="list-inside list-disc text-sm">
              {errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
