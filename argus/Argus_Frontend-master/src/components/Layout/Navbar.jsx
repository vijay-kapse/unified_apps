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
  VStack,
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
  const { logout } = useAuth();
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
      borderColor={useColorModeValue('slate.200', 'gray.700')}
      boxShadow="0 10px 30px rgba(15, 23, 42, 0.04)"
      px={{ base: 4, md: 7 }}
      position="fixed"
      top={0}
      w="full"
      zIndex="sticky"
    >
      <Flex h="76px" alignItems="center" justifyContent="space-between" gap={{ base: 2, md: 4 }}>
        <HStack spacing={{ base: 2, md: 4 }} minW={0}>
          <IconButton
            display={{ base: 'flex', md: 'none' }}
            onClick={onMobileMenuOpen}
            variant="outline"
            aria-label="open menu"
            icon={<HamburgerIcon />}
          />

          <HStack spacing={{ base: 2, md: 3 }} minW={0}>
            <ArgusLogoMark />
            <VStack display={{ base: 'none', md: 'flex' }} spacing={0} align="start" minW={0}>
              <Text
                fontSize={{ base: '2xl', md: '3xl' }}
                fontWeight="900"
                color="slate.900"
                letterSpacing="0"
                lineHeight="1"
                noOfLines={1}
              >
                ARGUS
              </Text>
              <Text
                display={{ base: 'none', sm: 'block' }}
                fontSize="xs"
                fontWeight="800"
                color="slate.500"
                letterSpacing="0"
                textTransform="uppercase"
                noOfLines={1}
              >
                Assisted document reading
              </Text>
            </VStack>
          </HStack>
        </HStack>

        <HStack spacing={{ base: 1, md: 4 }} flexShrink={0}>
          <Button
            as="a"
            href="/rms/apps"
            variant="outline"
            borderRadius="full"
            borderColor="blue.200"
            bg="blue.50"
            color="blue.700"
            fontWeight="700"
            _hover={{ bg: 'blue.100', textDecoration: 'none' }}
            size={{ base: 'sm', md: 'md' }}
          >
            <Text as="span" display={{ base: 'none', sm: 'inline' }}>Back to RMS</Text>
            <Text as="span" display={{ base: 'inline', sm: 'none' }}>RMS</Text>
          </Button>

          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<ChevronDownIcon />}
              variant="ghost"
              size={{ base: 'sm', md: 'md' }}
              color="slate.700"
            >
              <Text as="span" display={{ base: 'none', sm: 'inline' }}>Account</Text>
              <Text as="span" display={{ base: 'inline', sm: 'none' }}>Acct</Text>
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
