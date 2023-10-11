import { useState } from 'react';
import { UserShare } from '../../api/types';
import { QDialog } from '../../components/QDialog';
import { ShareMenu } from '../../components/ShareMenu';

export function TeamShareMenu({ onClose, team }: { onClose: () => void; team: any }) {
  // const theme = useTheme();
  // const rootLoaderData = useRootRouteLoaderData();
  // const currentUser = rootLoaderData.user;

  const [users, setUsers] = useState(team.users);

  return (
    <QDialog onClose={onClose}>
      <QDialog.Title>Share team “{team.name}”</QDialog.Title>
      <QDialog.Content>
        {/* <ShareMenu fetcherUrl={'test'} permission={'OWNER'} uuid={'1'} /> */}
        <ShareMenu.Wrapper>
          <ShareMenu.Invite
            onInvite={({ email, role }) => {
              setUsers((prev: any) => [
                ...prev,
                {
                  email,
                  permissions: {
                    role,
                    access: [
                      /* access controls come from the server */
                    ],
                  },
                },
              ]);
            }}
            userEmails={users.map(({ email }: any) => email)}
          />
          <ShareMenu.Users
            users={users}
            // usersIndexForLoggedInUser={users.findIndex((user: UserShare) => user.email === '')}
            onUpdateUser={(user: UserShare) => {
              setUsers((prevUsers: UserShare[]) =>
                prevUsers.map((prevUser) => {
                  if (prevUser.email === user.email) {
                    return { ...prevUser, ...user };
                  } else {
                    return prevUser;
                  }
                })
              );
            }}
            onDeleteUser={(user: UserShare) => {
              console.log(user);
              setUsers((prevUsers: UserShare[]) => prevUsers.filter((prevUser) => prevUser.email !== user.email));
            }}
            // Current user and their relationship to the current team
            usersIndexForLoggedInUser={
              // TODO this needs to come from the app
              0
              // Test owner
            }
          />

          {/* 

              // avatar={
              //   user.isPending ? (
              //     <Avatar sx={{ width: 24, height: 24, fontSize: '16px' }}>
              //       <EmailOutlined fontSize="inherit" />
              //     </Avatar>
              //   ) : (
              //     <AvatarWithLetters
              //       src={user.picture ? user.picture : null}
              //       sx={{ width: 24, height: 24, fontSize: '.875rem' }}
              //     >
              //       {user.name ? user.name : user.email}
              //     </AvatarWithLetters>
              //   )
              // }
              // primary={user.isPending ? user.email : user.name ? user.name : user.email}
              // secondary={
              //   user.isPending ? (
              //     <Stack direction="row" gap={theme.spacing(0.5)}>
              //       Invite sent.{' '}
              //       <ButtonBase sx={{ textDecoration: 'underline', fontSize: 'inherit', fontFamily: 'inherit' }}>
              //         Resend
              //       </ButtonBase>
              //     </Stack>
              //   ) : user.name ? (
              //     user.email
              //   ) : (
              //     ''
              //   )
              // }
              // action={<ShareMenu.ListItemUserActions value={user.permission} setValue={() => {}} />}
        */}
        </ShareMenu.Wrapper>
      </QDialog.Content>
    </QDialog>
  );
}
