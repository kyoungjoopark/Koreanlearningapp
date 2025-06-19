import os
import re
import io
import numpy as np
import cv2
from supabase import create_client, Client
from dotenv import load_dotenv
import fitz  # PyMuPDF
import easyocr

# OCR 관련 라이브러리 추가
try:
    from PIL import Image
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False

# .env.local 파일에서 환경 변수를 로드합니다.
# 이 스크립트는 'korean-learning-app' 폴더 내에서 실행해야 합니다.
load_dotenv(dotenv_path='.env.local')

# Supabase 클라이언트 초기화
url: str = os.environ.get("NEXT_PUBLIC_LEARNING_SUPABASE_URL")
key: str = os.environ.get("LEARNING_SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    raise Exception("Supabase URL 또는 Service Key를 .env.local 파일에서 찾을 수 없습니다. 변수명을 확인해주세요.")

supabase: Client = create_client(url, key)

print("Supabase 클라이언트 초기화 완료.")

def get_level_from_stars(star_count):
    if star_count == 1:
        return '초급'
    if star_count == 2:
        return '중급'
    if star_count >= 3:
        return '고급'
    return None

def parse_body(text_body):
    meaning_part_str = ""
    example_part_str = ""
    
    # "예:" 또는 "예)"를 기준으로 의미와 예문 섹션을 나눔
    example_match = re.search(r'예[:\)](.*)', text_body, re.DOTALL)
    if not example_match:
        # "예"가 없으면, 대화 형식("가:", "나:")을 기준으로 나눔
        example_match = re.search(r'\n[가-라]:', text_body, re.DOTALL)

    if example_match:
        example_part_str = text_body[example_match.start():].strip()
        meaning_part_str = text_body[:example_match.start()].strip()
    else:
        meaning_part_str = text_body
    
    def split_lang_and_clean(text_str):
        korean_lines = []
        english_lines = []
        
        for line in text_str.strip().split('\n'):
            line = line.strip()
            if not line: continue
            
            # 영어 알파벳이 포함된 줄은 영어로 간주
            if re.search(r'[a-zA-Z]', line):
                english_lines.append(line)
            else:
                # 한글 줄에서 불필요한 접두사 제거
                line = re.sub(r'^(예|유|·|[가-라]):', '', line).strip()
                korean_lines.append(line)
        
        return " ".join(korean_lines), " ".join(english_lines)

    meaning_ko, meaning_en = split_lang_and_clean(meaning_part_str)
    example_ko, example_en = split_lang_and_clean(example_part_str)
    
    return meaning_ko, meaning_en, example_ko, example_en

def process_pdf_and_upload(bucket_name="intro", file_path="Koreanidiom.pdf"):
    print(f"스토리지 버킷 '{bucket_name}'에서 '{file_path}' 다운로드 시작...")
    try:
        response = supabase.storage.from_(bucket_name).download(file_path)
        pdf_bytes = response
        print("다운로드 완료.")

        print("EasyOCR 모델 로드 중...")
        reader = easyocr.Reader(['ko', 'en'], gpu=False)
        print("EasyOCR 모델 로드 완료.")

        template_path = 'scripts/filled_star.png'
        template = cv2.imread(template_path, 0)
        if template is None:
             raise FileNotFoundError(f"별 템플릿 파일을 로드할 수 없습니다: {template_path}")
        w, h = template.shape[::-1]
        print("별 템플릿 로드 완료.")
        
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        all_final_records = []
        
        start_page = 14
        end_page = 392

        print(f"{start_page}페이지부터 {end_page}페이지까지 처리 시작...")

        for page_num in range(start_page - 1, min(end_page, doc.page_count)):
            page = doc.load_page(page_num)
            
            pix = page.get_pixmap(dpi=300)
            img_bgr = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
            
            ocr_results = reader.readtext(img_bgr, detail=1)
            
            # 1. 글자 크기(bbox 높이)를 기반으로 '표현' 후보 찾기
            box_heights = [bbox[2][1] - bbox[0][1] for bbox, text, prob in ocr_results]
            avg_height = np.mean(box_heights)
            expression_candidates = []
            other_texts = []
            for (bbox, text, prob) in ocr_results:
                height = bbox[2][1] - bbox[0][1]
                if height > avg_height * 1.5:  # 평균보다 1.5배 큰 텍스트를 '표현' 후보로 간주
                    expression_candidates.append({'text': text, 'bbox': bbox})
                else:
                    other_texts.append({'text': text, 'bbox': bbox})

            # 2. 별 위치 찾기
            img_gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
            res = cv2.matchTemplate(img_gray, template, cv2.TM_CCOEFF_NORMED)
            threshold = 0.8
            loc = np.where(res >= threshold)
            
            # 3. '표현' 후보와 별을 연결하여 헤더 생성
            headers = []
            for expr in expression_candidates:
                expr_y_center = (expr['bbox'][0][1] + expr['bbox'][2][1]) / 2
                
                star_count = 0
                for pt in zip(*loc[::-1]):
                    # 표현의 y좌표와 비슷한 높이에 있는 별 개수를 셈
                    if abs(pt[1] - expr_y_center) < h * 2:
                        star_count += 1
                
                level = get_level_from_stars(star_count)
                if level:
                    headers.append({'expression': expr['text'], 'bbox': expr['bbox'], 'level': level})

            # 4. 헤더를 기준으로 본문 내용 찾고 최종 레코드 생성
            headers.sort(key=lambda h: h['bbox'][0][1]) # y좌표로 정렬
            for i, header in enumerate(headers):
                start_y = header['bbox'][2][1]
                end_y = pix.height
                if i + 1 < len(headers):
                    end_y = headers[i+1]['bbox'][0][1]

                body_text = ""
                # 정렬된 텍스트 조각을 사용하여 순서 보장
                sorted_body_texts = sorted([t for t in other_texts if t['bbox'][0][1] > start_y and t['bbox'][0][1] < end_y], key=lambda t: t['bbox'][0][1])
                for t in sorted_body_texts:
                    body_text += t['text'] + "\n"

                meaning_ko, meaning_en, example_ko, example_en = parse_body(body_text)
                
                all_final_records.append({
                    "expression": header['expression'],
                    "level": header['level'],
                    "meaning": meaning_ko,
                    "meaning_en": meaning_en,
                    "example_sentence": example_ko,
                    "example_sentence_en": example_en
                })

            if (page_num + 1) % 10 == 0:
                print(f"... 처리 중: {page_num + 1} / {min(end_page, doc.page_count)} 페이지 ...")
        
        doc.close()

        if not all_final_records:
            print("업로드할 데이터가 없습니다.")
            return

        print(f"데이터 정제 및 업로드 시작... 총 {len(all_final_records)}개")
        
        # 중복 제거 로직 추가
        unique_records_dict = {}
        for record in all_final_records:
            unique_records_dict[record['expression']] = record
        
        unique_records_list = list(unique_records_dict.values())
        print(f"중복 제거 후 {len(unique_records_list)}개의 고유한 레코드 준비 완료.")

        if not unique_records_list:
            print("업로드할 유효한 데이터가 없습니다.")
            return
            
        try:
            # 중복 제거된 리스트를 업로드
            data, count = supabase.table('idioms').upsert(unique_records_list, on_conflict='expression').execute()
            print(f"성공적으로 {len(data[1])}개의 데이터를 업로드/업데이트했습니다.")
        except Exception as e:
            print(f"데이터 업로드 중 오류 발생: {e}")

    except Exception as e:
        print(f"전체 프로세스 중 오류 발생: {e}")
        return

if __name__ == "__main__":
    process_pdf_and_upload() 