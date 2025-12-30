local json = require("json")

-- ==========================================
-- CONFIGURATION
-- ==========================================
-- Replace with the actual AO Token Process ID
AO_TOKEN_PROCESS = "0000000000000000000000000000000000000000000" 
FOUNDER_ADDRESS = "YOUR_FOUNDER_WALLET_ADDRESS_HERE"
BURN_ADDRESS = "0000000000000000000000000000000000000000000"

-- ==========================================
-- STATE
-- ==========================================
Novels = Novels or {}
ChapterContents = ChapterContents or {} 
Purchases = Purchases or {} 
Earnings = Earnings or {}

-- ==========================================
-- HELPER FUNCTIONS
-- ==========================================
function GenerateId()
  return tostring(os.time()) .. "-" .. tostring(math.random(1000, 9999))
end

-- ==========================================
-- HANDLERS
-- ==========================================

-- 1. Create Novel
Handlers.add("Create-Novel", Handlers.utils.hasMatchingTag("Action", "Create-Novel"), function(msg)
  local title = msg.Tags.Title
  local description = msg.Tags.Description
  
  if not title or not description then
    ao.send({ Target = msg.From, Data = "Title and Description are required." })
    return
  end

  local id = GenerateId()
  Novels[id] = {
    Id = id,
    Title = title,
    Description = description,
    Author = msg.From,
    CreatedAt = msg.Timestamp,
    LastUpdate = msg.Timestamp,
    Chapters = {}
  }

  ao.send({ Target = msg.From, Data = json.encode({ Status = "Success", NovelId = id }) })
  print("Created novel: " .. title)
end)

-- 2. Add Chapter
Handlers.add("Add-Chapter", Handlers.utils.hasMatchingTag("Action", "Add-Chapter"), function(msg)
  local novelId = msg.Tags.NovelId
  local title = msg.Tags.Title
  local isPaid = msg.Tags.IsPaid == "true"
  local price = tonumber(msg.Tags.Price) or 0
  local content = msg.Data

  if not Novels[novelId] then
    ao.send({ Target = msg.From, Data = "Novel not found." })
    return
  end

  if Novels[novelId].Author ~= msg.From then
    ao.send({ Target = msg.From, Data = "Only the author can add chapters." })
    return
  end

  table.insert(Novels[novelId].Chapters, {
    Title = title,
    Price = price,
    IsPaid = isPaid,
    WordCount = string.len(content)
  })

  local chapterIndex = #Novels[novelId].Chapters
  ChapterContents[novelId .. "_" .. chapterIndex] = content
  Novels[novelId].LastUpdate = msg.Timestamp

  ao.send({ Target = msg.From, Data = "Chapter added successfully." })
end)

-- 3. Handle Payment (Credit-Notice)
-- Triggered when user sends AO Tokens to this process
Handlers.add("Payment-Handler", Handlers.utils.hasMatchingTag("Action", "Credit-Notice"), function(msg)
  -- Verify the token is the correct AO Token (Optional security check)
  -- if msg.From ~= AO_TOKEN_PROCESS then return end

  local sender = msg.Tags.Sender
  local quantity = tonumber(msg.Quantity)
  local xAction = msg.Tags["X-Action"]
  
  if xAction == "Buy-Chapter" then
    local novelId = msg.Tags["X-NovelId"]
    local index = tonumber(msg.Tags["X-ChapterIndex"])
    
    local novel = Novels[novelId]
    if not novel or not novel.Chapters[index] then
      -- Refund logic could go here
      print("Invalid purchase attempt: " .. (novelId or "nil"))
      return
    end

    local chapter = novel.Chapters[index]
    
    -- Verify Amount
    if quantity < chapter.Price then
      print("Insufficient payment")
      return
    end

    -- Record Purchase
    local purchaseKey = sender .. "_" .. novelId .. "_" .. index
    Purchases[purchaseKey] = true

    -- Revenue Split
    local burnAmount = math.floor(quantity * 0.18)
    local founderAmount = math.floor(quantity * 0.02)
    local authorAmount = quantity - burnAmount - founderAmount

    -- 1. Burn (Send to Burn Address)
    if burnAmount > 0 then
      ao.send({
        Target = msg.From, -- The Token Process
        Action = "Transfer",
        Recipient = BURN_ADDRESS,
        Quantity = tostring(burnAmount)
      })
    end

    -- 2. Founder
    if founderAmount > 0 then
      ao.send({
        Target = msg.From,
        Action = "Transfer",
        Recipient = FOUNDER_ADDRESS,
        Quantity = tostring(founderAmount)
      })
    end

    -- 3. Author
    if authorAmount > 0 then
      ao.send({
        Target = msg.From,
        Action = "Transfer",
        Recipient = novel.Author,
        Quantity = tostring(authorAmount)
      })
      Earnings[novel.Author] = (Earnings[novel.Author] or 0) + authorAmount
    end

    print("Purchase successful for " .. sender)
  end
end)

-- 4. Read Chapter
Handlers.add("Read-Chapter", Handlers.utils.hasMatchingTag("Action", "Read-Chapter"), function(msg)
  local novelId = msg.Tags.NovelId
  local index = tonumber(msg.Tags.ChapterIndex)
  local reader = msg.From

  local novel = Novels[novelId]
  if not novel or not novel.Chapters[index] then
    ao.send({ Target = reader, Data = "Chapter not found." })
    return
  end

  local chapter = novel.Chapters[index]
  local purchaseKey = reader .. "_" .. novelId .. "_" .. index

  -- Access Control
  if novel.Author == reader or not chapter.IsPaid or Purchases[purchaseKey] then
    local content = ChapterContents[novelId .. "_" .. index]
    ao.send({ Target = reader, Data = json.encode({ Content = content, Title = chapter.Title }) })
  else
    ao.send({ Target = reader, Data = json.encode({ Error = "Payment required." }) })
  end
end)

-- 5. List Novels
Handlers.add("List-Novels", Handlers.utils.hasMatchingTag("Action", "List-Novels"), function(msg)
  local list = {}
  for _, novel in pairs(Novels) do
    table.insert(list, novel)
  end
  ao.send({ Target = msg.From, Data = json.encode(list) })
end)

-- 6. Get Novel
Handlers.add("Get-Novel", Handlers.utils.hasMatchingTag("Action", "Get-Novel"), function(msg)
  local novelId = msg.Tags.NovelId
  local novel = Novels[novelId]
  if novel then
    ao.send({ Target = msg.From, Data = json.encode(novel) })
  else
    ao.send({ Target = msg.From, Data = "null" })
  end
end)
