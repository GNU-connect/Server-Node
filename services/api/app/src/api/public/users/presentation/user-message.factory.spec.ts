import { UserMessageFactory } from 'src/api/public/users/presentation/user-message.factory';

describe('UserMessageFactory', () => {
  let factory: UserMessageFactory;

  beforeEach(() => {
    factory = new UserMessageFactory();
  });

  it('구조화된 프로필을 기존 카카오 프로필 문구로 렌더링한다', () => {
    const result = factory.createProfileMessage({
      userId: 'kakao-user-id',
      campus: { id: 1, name: '가좌캠퍼스' },
      college: { id: 3, name: '공과대학' },
      department: { id: 10, name: '컴퓨터공학부' },
    });

    expect(result.outputs[0]).toEqual(
      expect.objectContaining({
        textCard: expect.objectContaining({
          title: '내 정보',
          description:
            '[ID]\nkakao-user-id\n\n[캠퍼스]\n가좌캠퍼스\n\n[전공]\n공과대학 컴퓨터공학부',
        }),
      }),
    );
  });

  it('미설정 프로필을 기존 미등록 문구로 렌더링한다', () => {
    const result = factory.createProfileMessage({
      userId: 'kakao-user-id',
      campus: null,
      college: null,
      department: null,
    });

    expect(result.outputs[0]).toEqual(
      expect.objectContaining({
        textCard: expect.objectContaining({
          description: '[ID]\nkakao-user-id\n\n[캠퍼스]\n미등록\n\n[전공]\n미등록',
        }),
      }),
    );
  });
});
