import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  VStack,
  Stack,
  useToast,
} from '@chakra-ui/react';
import PageContainer from '../../../common/components/PageContainer';
import Markdown from '../../../common/components/Markdown';
import { getVersionInfo } from '../../../common/services/system/controller';
import { trackPageView } from '../../../common/services/analytics';

const AboutPage: React.FC = () => {
  const toast = useToast();
  const currentVersion = window.electron.ipcRenderer.get('get-version');
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updates, setUpdates] = useState<
    {
      version: string;
      url: string;
      description: string;
    }[]
  >([]);

  const checkUpdate = async () => {
    const cv = window.electron.ipcRenderer.get('get-version');
    const versionUpdates = await getVersionInfo(cv);
    if (versionUpdates.length > 0) {
      setUpdates(versionUpdates);
      setIsUpdateModalOpen(false);
    } else {
      toast({
        title: '已经是最新版本',
        position: 'top',
        status: 'success',
        duration: 1000,
        isClosable: true,
      });
    }
  };

  // 确认更新则跳转到最新版本的下载链接
  const confirmUpdate = () => {
    const latestVersion = updates[0]; // 假设第一个总是最新版本
    if (latestVersion) {
      window.electron.ipcRenderer.sendMessage('open-url', latestVersion.url);
    }
  };

  useEffect(() => {
    trackPageView('AboutPage');
  }, []);

  return (
    <PageContainer>
      <VStack>
        <Markdown
          content={`
      `}
        />
      </VStack>

      <br />

      <Box p={5}>
        <Stack spacing={3}>
          <Text fontWeight="bold">版本信息</Text>
          <Text>AI万能客服 {currentVersion}</Text>

          {/* 检查更新 */}
          <Button size="sm" onClick={checkUpdate}>
            检查更新
          </Button>
        </Stack>
      </Box>

      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>版本更新</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>当前版本是 {currentVersion}. 检查到以下更新：</Text>
            <VStack spacing={4} mt="20px">
              {updates.map((update, index) => (
                <Box key={index}>
                  <Markdown content={update.description} />
                </Box>
              ))}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={confirmUpdate}>
              立即更新到最新版本
            </Button>
            <Button variant="ghost" onClick={() => setIsUpdateModalOpen(false)}>
              关闭
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </PageContainer>
  );
};

export default AboutPage;
