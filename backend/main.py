from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="5-d Interpolator Backend",
    description="Takes 5 inputs and outputs 5*input",
    version="0.1.0",
    contact={"name": "ScreaM"},
    license_info={"name": "MIT"},
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # your Next.js dev URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Item(BaseModel):
    input1: float
    input2: float
    input3: float
    input4: float
    input5: float

@app.get("/")
def hello():
    return {"message": "Hello gay👋"}


@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/5d_")
def create(item: Item):
    inputs = [
        item.input1,
        item.input2,
        item.input3,
        item.input4,
        item.input5,
    ]
    outputs = [5 * i for i in inputs]
    return {"outputs": outputs}

