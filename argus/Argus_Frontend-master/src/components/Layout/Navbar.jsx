import {
    Box,
    Flex,
    IconButton,
    useColorModeValue,
    Text,
    HStack,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Button,
  } from '@chakra-ui/react';
  import { PORTAL_HOME_URL } from '../../utils/constants';
  import { HamburgerIcon, ChevronDownIcon } from '@chakra-ui/icons';
  import { useAuth } from '../../contexts/AuthContext'
  
  const Navbar = ({ onOpen }) => {
    const { user, logout } = useAuth();
  
    const handleLogout = async () => {
      await logout();
      window.location.assign(PORTAL_HOME_URL);
    };
  
    return (
      <Box
        bg={useColorModeValue('white', 'gray.900')}
        px={4}
        position="fixed"
        w="full"
        boxShadow="sm"
      >
        <Flex h={16} alignItems="center" justifyContent="space-between">
          <IconButton
            display={{ base: 'flex', md: 'none' }}
            onClick={onOpen}
            variant="outline"
            aria-label="open menu"
            icon={<HamburgerIcon />}
          />
  
          <Text
            fontSize="2xl"
            fontWeight="bold"
            color="brand.700"
          >
            ARGUS
          </Text>
  
          <HStack spacing={4}>
            <Button as="a" href={PORTAL_HOME_URL} variant="ghost">Back to Portal</Button>
            <Menu>
              <MenuButton
                as={Button}
                rightIcon={<ChevronDownIcon />}
                variant="ghost"
              >
                {user?.username}
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
  