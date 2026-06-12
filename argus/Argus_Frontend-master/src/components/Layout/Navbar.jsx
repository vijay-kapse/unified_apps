import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { ChevronDownIcon, HamburgerIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = ({ onMobileMenuOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Box
      bg={useColorModeValue('white', 'gray.900')}
      px={4}
      position="fixed"
      w="full"
      boxShadow="sm"
      zIndex="sticky"
    >
      <Flex h={16} alignItems="center" justifyContent="space-between" gap={4}>
        <HStack spacing={3} minW={0}>
          <IconButton
            display={{ base: 'flex', md: 'none' }}
            onClick={onMobileMenuOpen}
            variant="outline"
            aria-label="open menu"
            icon={<HamburgerIcon />}
          />

          <HStack spacing={3} minW={0}>
            <Image
              src={`${process.env.PUBLIC_URL}/argus-logo.svg`}
              alt="ARGUS logo"
              boxSize="40px"
              objectFit="contain"
            />
            <Text
              fontSize={{ base: 'xl', md: '2xl' }}
              fontWeight="bold"
              color="brand.700"
              lineHeight="1"
              noOfLines={1}
            >
              ARGUS
            </Text>
          </HStack>
        </HStack>

        <HStack spacing={{ base: 2, md: 4 }} flexShrink={0}>
          <Button
            as="a"
            href="/rms/"
            variant="outline"
            colorScheme="brand"
            size={{ base: 'sm', md: 'md' }}
          >
            Back to RMS
          </Button>

          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<ChevronDownIcon />}
              variant="ghost"
              size={{ base: 'sm', md: 'md' }}
            >
              {user?.username || 'Account'}
            </MenuButton>
            <MenuList>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
    </Box>
  );
};

export default Navbar;
