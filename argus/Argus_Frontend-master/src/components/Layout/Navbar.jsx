import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
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

const ArgusLogoMark = () => (
  <Box
    as="svg"
    viewBox="0 0 48 48"
    boxSize="42px"
    flexShrink={0}
    role="img"
    aria-label="ARGUS logo"
  >
    <defs>
      <linearGradient id="argusHeaderBg" x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#111827" />
        <stop offset="1" stopColor="#475569" />
      </linearGradient>
      <linearGradient id="argusHeaderAccent" x1="16" y1="16" x2="38" y2="39" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#a7f3d0" />
        <stop offset="1" stopColor="#60a5fa" />
      </linearGradient>
    </defs>
    <rect x="5" y="5" width="38" height="38" rx="11" fill="url(#argusHeaderBg)" />
    <path d="M15 13h14l7 7v14H15z" fill="#f8fafc" opacity="0.96" />
    <path d="M29 13v7h7" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinejoin="round" />
    <path d="M19 24h11M19 29h8" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
    <circle cx="29" cy="28" r="8" fill="none" stroke="url(#argusHeaderAccent)" strokeWidth="3" />
    <path d="M35 34l6 6" stroke="#a7f3d0" strokeWidth="3" strokeLinecap="round" />
  </Box>
);

const Navbar = ({ onMobileMenuOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Box
      as="header"
      bg={useColorModeValue('white', 'gray.900')}
      borderBottom="1px solid"
      borderColor={useColorModeValue('gray.200', 'gray.700')}
      px={{ base: 4, md: 6 }}
      position="fixed"
      top={0}
      w="full"
      zIndex="sticky"
    >
      <Flex h="72px" alignItems="center" justifyContent="space-between" gap={4}>
        <HStack spacing={4} minW={0}>
          <IconButton
            display={{ base: 'flex', md: 'none' }}
            onClick={onMobileMenuOpen}
            variant="outline"
            aria-label="open menu"
            icon={<HamburgerIcon />}
          />

          <HStack spacing={3} minW={0}>
            <ArgusLogoMark />
            <Text
              fontSize={{ base: '2xl', md: '3xl' }}
              fontWeight="800"
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
