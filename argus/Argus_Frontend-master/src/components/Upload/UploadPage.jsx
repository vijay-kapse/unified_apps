import {
  Box,
  Container,
  VStack,
  Text,
  useToast,
  Button,
  Input,
  List,
  ListItem,
} from '@chakra-ui/react';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const UploadPage = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const toast = useToast();
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    if (!files.length) {
      toast({
        title: 'No files selected',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));

      const response = await fetch('/api/upload/', {
        method: 'POST',
        credentials: 'include',  
        headers: {
          'X-CSRFToken': document.cookie.match(/csrftoken=([\w-]+)/)?.[1] || '',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();

      if (data.valid_files && data.valid_files.length > 0) {
        toast({
          title: 'Upload Successful',
          description: `Successfully uploaded ${data.valid_files.length} files`,
          status: 'success',
          duration: 5000,
        });
        navigate('/results'); // Navigate to results after successful upload
      }

      if (data.invalid_files && data.invalid_files.length > 0) {
        toast({
          title: 'Some files were not uploaded',
          description: `Invalid files: ${data.invalid_files.map(f => f.name).join(', ')}`,
          status: 'warning',
          duration: 5000,
        });
      }

      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={6}>
        <Box
          w="full"
          p={6}
          bg="white"
          borderRadius="lg"
          shadow="base"
        >
          <VStack spacing={4}>
            <Input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={uploading}
              p={1}
            />
            
            {files.length > 0 && (
              <Box w="full">
                <Text fontWeight="bold" mb={2}>Selected files:</Text>
                <List spacing={2}>
                  {files.map(file => (
                    <ListItem key={file.name} fontSize="sm" color="gray.600">
                      {file.name} ({(file.size / 1024).toFixed(2)} KB)
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            <Button
              colorScheme="green"
              onClick={handleUpload}
              isLoading={uploading}
              loadingText="Uploading..."
              w="full"
            >
              Upload Files
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default UploadPage;