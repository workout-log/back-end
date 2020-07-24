# 스키마(schema)

## 사용자(User)

| 필드 이름      | 데이터 타입    | 설명              |
| -------------- | -------------- | ----------------- |
| userName       | String(문자열) | 사용자 이름       |
| email          | String(문자열) | 비밀번호          |
| profileImage   | String(문자열) | 프로필 이미지 주소 |
| loginType      | String(문자열) | 로그인 타입, ex) gg(google)       ||

## 포스트(post)

| 필드 이름     | 데이터 타입                                         | 설명        |
| ------------- | --------------------------------------------------- | ----------- |
| title         | String(문자열)                                      | 제목        |
| files         | Buffer(이미지, 동영상)                              | 파일 목록   |
| body          | String(문자열)                                      | 내용        |
| tags          | [String](문자열 배열)                               | 태그 목록   |
| publishedDate | Date(날짜)                                          | 작성 날짜   |
| likeUsers     | [mongoose.Types.Object]                             | 좋아요 상태 |
| likes         | Number(숫자)                                        | 좋아요 수   |
| isPrivate     | Booleaen                                            | 나만보기    |
| user          | { \_id: mongoose.Types.ObjectId, username: String } | 작성자      |
