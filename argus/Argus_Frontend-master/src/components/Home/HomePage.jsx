import {
  Box,
  Container,
  VStack,
  Text,
  SimpleGrid,
  Button,
  useToast,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DocumentCard from '../SearchResults/DocumentCard';

import { useCallback } from 'react';



const HomePage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();

  const fetchSessionDocuments = useCallback(async () => {
    try {
      const response = await fetch('/api/results/', {
        credentials: 'include', // Add this line
      });
      if (!response.ok) throw new Error('Failed to fetch documents');
  
      const data = await response.json();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({
        title: 'Error fetching documents',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]); // Add 'toast' because it comes from a hook and could change.
  
  useEffect(() => {
    fetchSessionDocuments();
  }, [fetchSessionDocuments]);
  

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Text fontSize="2xl" fontWeight="bold" color="green.700">
          Current Session Documents
        </Text>

        {loading ? (
          <Text>Loading documents...</Text>
        ) : documents.length > 0 ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {documents.map((doc) => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
          </SimpleGrid>
        ) : (
          <Box textAlign="center" py={10}>
            <Text mb={4}>No documents uploaded in this session</Text>
            <Button
              colorScheme="green"
              onClick={() => navigate('/upload')}
            >
              Upload Documents
            </Button>
          </Box>
        )}
      </VStack>
    </Container>
  );
};

export default HomePage;