# sealed 모듈이 제공해야 하는 것

애플리케이션은 아래 네 함수만 호출합니다. 그 밖의 계산을 애플리케이션
코드에서 직접 하지 마십시오.

```
population_band(agency_handle, reference_date)
    → 인구 구간을 돌려준다
    구간의 경계값은 호출하는 쪽이 알지 못한다

peer_group(agency_handle, reference_date)
    → 동류 집단 식별자를 돌려준다

band_of(agency_handle, section_kind, reference_date)
    → 동류 집단 안에서의 분위 밴드를 돌려준다
    밴드 안에서 다시 정렬하지 않는다. 정렬하면 순위가 된다

residual_spread(peer_group_id, archetype, section_kind, reference_date)
    → 여건을 고정한 뒤 남는 폭을 돌려준다
    폭의 원인을 함께 돌려주지 않는다. 원인은 관측 범위 밖이다
```

## 돌려주지 않는 것

아래를 돌려주는 함수를 만들지 마십시오. 부르는 쪽에서 쓸 자리가 없습니다.

- 기관별 총점
- 순위 또는 순서가 있는 목록
- 등급 문자열
- 빈칸의 개수
- 미래 값의 예측

## 호출 기록

산출물의 재현을 위해, 모든 호출에 `reference_date`를 넘기고 그 값을
산출 레코드에 남깁니다. 기준일 없이 계산된 값은 재현할 수 없습니다.
