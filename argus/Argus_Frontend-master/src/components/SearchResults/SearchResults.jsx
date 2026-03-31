// src/components/SearchResults/SearchResults.jsx
import {
  Box,
  Container,
  VStack,
  Input,
  Button,
  Text,
  SimpleGrid,
  useToast,
  HStack,
  Tag,
  TagLabel,
  TagCloseButton,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import DocumentCard from './DocumentCard';

const SearchResults = () => {
  const [currentTerm, setCurrentTerm] = useState('');
  const [searchTerms, setSearchTerms] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionDocuments, setSessionDocuments] = useState([]);
  const toast = useToast();

  // Fetch documents in current session on mount
  useEffect(() => {
    fetchSessionDocuments();
  }, []);



  const fetchSessionDocuments = async () => {
    try {
      const response = await fetch('/api/results/', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setSessionDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching session documents:', error);
    }
};



const addSearchTerm = () => {
  if (currentTerm.trim()) {
    // Treat the entire input as one term, don't split words
    const termExists = searchTerms.includes(currentTerm.trim());
    if (!termExists) {
      setSearchTerms([...searchTerms, currentTerm.trim()]);
    }
    setCurrentTerm('');
  }
};

  const removeTerm = (indexToRemove) => {
    setSearchTerms(searchTerms.filter((_, index) => index !== indexToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addSearchTerm();
    }
  };
//   const handleSearch = async () => {
//     if (searchTerms.length === 0) {
//       toast({
//         title: 'Add search terms',
//         description: 'Please add at least one search term',
//         status: 'warning',
//         duration: 3000,
//       });
//       return;
//     }

//     setLoading(true);
//     try {
//       // Join all terms with ||| if there are multiple terms
//       const searchQuery = searchTerms.length === 1 ? 
//         searchTerms[0] : 
//         searchTerms.join('|||');
      
//       const response = await fetch(`/api/search/?q=${encodeURIComponent(searchQuery)}`, {
//         credentials: 'include'
//       });
//       const data = await response.json();

//       if (response.ok) {
//         setDocuments(data.documents || []);
//         toast({
//           title: `Found ${data.total_results} results`,
//           status: 'success',
//           duration: 3000,
//         });
//       } else {
//         throw new Error(data.message || 'Search failed');
//       }
//     } catch (error) {
//       toast({
//         title: 'Search failed',
//         description: error.message,
//         status: 'error',
//         duration: 5000,
//       });
//       setDocuments([]);
//     } finally {
//       setLoading(false);
//     }
// };
// const handleSearch = async () => {
//   if (searchTerms.length === 0) {
//     toast({
//       title: 'Add search terms',
//       description: 'Please add at least one search term',
//       status: 'warning',
//       duration: 3000,
//     });
//     return;
//   }

//   setLoading(true);
//   try {
//     // Create separate parameters for each complete term
//     const searchParams = new URLSearchParams();
//     searchTerms.forEach(term => searchParams.append('q', term));
    
//     const response = await fetch(`/api/search/?${searchParams.toString()}`, {
//       credentials: 'include'
//     }
//   );
//     const data = await response.json();

//     if (response.ok) {
//       setDocuments(data.documents || []);
//       toast({
//         title: `Found ${data.total_results} results`,
//         status: 'success',
//         duration: 3000,
//       });
//     } else {
//       throw new Error(data.message || 'Search failed');
//     }
//   } catch (error) {
//     toast({
//       title: 'Search failed',
//       description: error.message,
//       status: 'error',
//       duration: 5000,
//     });
//     setDocuments([]);
//   } finally {
//     setLoading(false);
//   }
// };

const handleSearch = async () => {
  if (searchTerms.length === 0) {
    toast({
      title: 'Add search terms',
      description: 'Please add at least one search term',
      status: 'warning',
      duration: 3000,
    });
    return;
  }

  setLoading(true);
  try {
    // Fetch the CSRF token from cookies
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken'))
      ?.split('=')[1];

    if (!csrfToken) {
      throw new Error('CSRF token not found. Ensure you are authenticated.');
    }

    // Send the CSRF token in headers
    const response = await fetch('/api/search/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      credentials: 'include',
      body: JSON.stringify({ q: searchTerms }),
    });

    const data = await response.json();

    if (response.ok) {
      setDocuments(data.documents || []);
      toast({
        title: `Found ${data.total_results} results`,
        status: 'success',
        duration: 3000,
      });
    } else {
      throw new Error(data.message || 'Search failed');
    }
  } catch (error) {
    toast({
      title: 'Search failed',
      description: error.message,
      status: 'error',
      duration: 5000,
    });
    setDocuments([]);
  } finally {
    setLoading(false);
  }
};

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6}>
        {/* Search Section */}
        <Box w="full" p={6} bg="white" borderRadius="lg" shadow="base">
          <VStack spacing={4}>
            <HStack w="full">
              <Input
                placeholder="Enter a search term..."
                value={currentTerm}
                onChange={(e) => setCurrentTerm(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button onClick={addSearchTerm}>Add</Button>
            </HStack>

            {searchTerms.length > 0 && (
              <Box w="full">
                <HStack spacing={2} wrap="wrap">
                  {searchTerms.map((term, index) => (
                    <Tag 
                      key={index} 
                      size="md" 
                      borderRadius="full" 
                      variant="solid" 
                      colorScheme="green"
                    >
                      <TagLabel>{term}</TagLabel>
                      <TagCloseButton onClick={() => removeTerm(index)} />
                    </Tag>
                  ))}
                </HStack>
              </Box>
            )}

            <Button
              colorScheme="green"
              onClick={handleSearch}
              isLoading={loading}
              w="full"
            >
              Search
            </Button>
          </VStack>
        </Box>

        {/* Session Documents */}
        {sessionDocuments.length > 0 && !documents.length && (
          <Box w="full">
            <Text fontSize="lg" fontWeight="bold" mb={4}>Documents in Current Session:</Text>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {sessionDocuments.map((doc) => (
                <DocumentCard key={doc.id} document={doc} />
              ))}
            </SimpleGrid>
          </Box>
        )}

        {/* Search Results */}
        {documents.length > 0 && (
          <Box w="full">
            <Text fontSize="lg" fontWeight="bold" mb={4}>Search Results:</Text>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {documents.map((doc) => (
                <DocumentCard key={doc.id} document={doc} />
              ))}
            </SimpleGrid>
          </Box>
        )}
      </VStack>
    </Container>
  );
};

export default SearchResults;